import Websocket from 'ws';
import { CLIENT_TO_SERVER_MSG, SERVER_TO_CLIENT_MSG } from '../messageTypes';
/** Description of Client */

export default class Client {
  constructor() {
    this.socket = null;
    this.state = {};
    this.stateUpdateListeners = [];

    this.connect = (endpoint, accessToken) => {
      this.socket = new Websocket(endpoint, {
        headers: {
          token: accessToken
        }
      });
      this.socket.onmessage = this.onMessage;
      return new Promise((resolve, reject) => {
        this.socket.onopen = resolve;
        this.socket.onerror = reject;
      });
    };

    this.exchangeIdentifier = identifier => {
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
    };

    this.connectToState = stateIdentifier => {
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
    };

    this.addStateUpdateListener = (identifier, handler, properties = []) => {
      this.stateUpdateListeners = this.stateUpdateListeners.filter(listener => listener.identifier !== identifier);
      this.stateUpdateListeners.push({
        identifier,
        handler,
        properties
      });
    };

    this.removeStateUpdateListener = identifier => {
      this.stateUpdateListeners = this.stateUpdateListeners.filter(listener => listener.identifier !== identifier);
    };

    this.updateState = updates => {
      this.sendMessage({
        type: CLIENT_TO_SERVER_MSG.UPDATE_STATE,
        data: {
          updates
        }
      });
    };

    this.onError = handler => {
      this.socket.onerror = handler;
      this._syncErrorHandler = handler;
    };

    this.onMessage = msg => {
      const {
        type,
        data
      } = JSON.parse(msg.data);

      switch (type) {
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
    };

    this.onStateUpdated = ({
      updates
    }) => {
      const previousState = {};
      const updatedProperties = Object.keys(updates);
      updatedProperties.forEach(key => {
        previousState[key] = this.state[key];
      });
      this.state = { ...this.state,
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
    };

    this.onConnectedToState = ({
      state
    }) => {
      this.state = state;

      this._onStateConnectionEstablished(state);
    };

    this.onServerError = err => {
      if (this._syncErrorHandler) {
        this._syncErrorHandler(err);
      }
    };

    this.sendMessage = msg => {
      if (this.socket && this.socket.readyState === this.socket.OPEN) {
        this.socket.send(JSON.stringify(msg));
      } else {
        console.error('State syncer is not connected');
      }
    };

    this.getState = () => {
      return this.state;
    };
  }

}