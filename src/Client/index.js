import Websocket from 'ws';
import { CLIENT_TO_SERVER_MSG, SERVER_TO_CLIENT_MSG } from '../messageTypes';

/** Description of Client */
export default class Client {

    /** @private */
    socket = null;

    /** @private */
    state = {};

    /** @private */
    stateUpdateListeners = [];

    /**
     * Client.connect.
     * @param {String} endpoint - endpoint of the StateSyncer
     * @param {String} accessToken - access token
     * @return {Promise} a promise the will resolve when the connection opens
     */
    connect = (endpoint, accessToken) => {
        this.socket = new Websocket(endpoint, { headers: { token: accessToken } });
        this.socket.onmessage = this.onMessage;

        return new Promise((resolve, reject) => {
            this.socket.onopen = resolve;
            this.socket.onerror = reject;
        });
    };

    /**
     * Client.exchangeIdentifier.
     * @param {String} identifier - a unique identifier for this connection, could be some sort of user identifier
     * @return {Promise} a promise the will resolve when the exchange is successeful or not
     */
    exchangeIdentifier = (identifier) => {
        return new Promise((resolve, reject) => {
            this._onIdentifierExchangeSuccess = resolve;
            this._onIdentifierExchangeError = reject;

            this.sendMessage({
                type: CLIENT_TO_SERVER_MSG.EXCHANGE_IDENTIFIER,
                data: {
                    identifier
                }
            });
        });
    }

    /**
     * Client.connectToState.
     * @param {String} stateIdentifier - the identifier of the state to connect to
     * @return {Promise} a promise the will resolve when the state connection is complete
     */
    connectToState = (stateIdentifier) => {
        return new Promise((resolve, reject) => {
            this._onStateConnectionEstablished = resolve;
            this._onStateConnectionError = reject;

            this.sendMessage({
                type: CLIENT_TO_SERVER_MSG.CONNECT_TO_STATE,
                data: {
                    stateIdentifier
                }
            });
        });
    }

    /**
     * Client.connectToState.
     * @param {String} identifier - an arbitrary listener identifier, if you add another with the same identifier, the old one will be replaced.
     * @param {function(object, object, object):void} handler - a callback function for when the state has been updated. 
     * First argument is the new updates, second the previous state of those updates, third one is the entire state
     * @param {Array<String>} properties - a callback function for when the state has been updated.
     */
    addStateUpdateListener = (identifier, handler, properties = []) => {
        this.stateUpdateListeners = this.stateUpdateListeners.filter(listener => listener.identifier !== identifier);

        this.stateUpdateListeners.push({
            identifier,
            handler,
            properties
        });
    }

    /**
     * Client.removeStateUpdateListener.
     * @param {String} identifier - Listener identifier
     */
    removeStateUpdateListener = (identifier) => {
        this.stateUpdateListeners = this.stateUpdateListeners.filter(listener => listener.identifier !== identifier);
    }

    /**
     * Client.updateState.
     * @param {object} updates - an object containing updates that should be synced with the StateSyncer.
     */
    updateState = (updates) => {
        this.sendMessage({
            type: CLIENT_TO_SERVER_MSG.UPDATE_STATE,
            data: {
                updates
            }
        });
    }

    /**
     * Client.onError.
     * @param {function(object)} handler - callback function for when an error occurs.
     */
    onError = (handler) => {
        this.socket.onerror = handler;
        this._syncErrorHandler = handler;
    }

    /** @private */
    onMessage = (msg) => {
        const { type, data } = JSON.parse(msg.data);

        switch(type) {
            case SERVER_TO_CLIENT_MSG.STATE_UPDATED:
                this.onStateUpdated(data);
                break;
            case SERVER_TO_CLIENT_MSG.ERROR:
                this.onServerError(data);
                break;
            case SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ESTABLISHED:
                this.onConnectedToState(data);
                break;
            case SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR:
                this._onStateConnectionError(data);
                break;
            case SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_SUCCESS:
                this._onIdentifierExchangeSuccess(data);
                break;
            case SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_ERROR:
                this._onIdentifierExchangeError(data);
                break;
            default:
                console.error('Unknown server message');
                break;
        }
    }

    /** @private */
    onStateUpdated = ({ updates }) => {

        const previousState = {};
        const updatedProperties = Object.keys(updates);
        
        updatedProperties.forEach(key => {
            previousState[key] = this.state[key];
        });

        this.state = {
            ...this.state,
            ...updates
        };

        this.stateUpdateListeners.forEach(listener => {
            if (listener.properties.length > 0) {
                if (listener.properties.find(property => updates[property] !== undefined)) {
                    listener.handler(updates, previousState, this.state);
                }
            } else {
                listener.handler(updates, previousState, this.state);
            }
        });
    }

    /** @private */
    onConnectedToState = ({ state }) => {
        this.state = state;
        this._onStateConnectionEstablished(state);
    }

    /** @private */
    onServerError = (err) => {
        if (this._syncErrorHandler) {
            this._syncErrorHandler(err);
        }
    }

    /** @private */
    sendMessage = (msg) => {
        if (this.socket && this.socket.readyState === this.socket.OPEN) {
            this.socket.send(JSON.stringify(msg));
        } else {
            console.error('State syncer is not connected');
        }
    }

    /**
     * Client.getState.
     * @return {object} entire state
     */
    getState = () => {
        return this.state;
    }
}