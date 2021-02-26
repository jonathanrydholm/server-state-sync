import { CLIENT_TO_SERVER_MSG, SERVER_TO_CLIENT_MSG } from '../messageTypes';
import { SYNC_ERROR } from '../errorTypes';

export default class SocketClient {

    identifier = null;

    server = null;

    socket = null;

    state = null;

    metadata = null;

    constructor(socket, server, metadata) {

        this.socket = socket;
        this.server = server;
        this.metadata = metadata;

        socket.onopen = this.onOpen;
        socket.onclose = this.onClose;
        socket.onerror = this.onError;
        socket.onmessage = this.onMessage;
    }

    onOpen = () => {}
    onClose = () => {}
    onError = () => {}

    onStateConnected = (state) => {
        this.state = state;
        this.socket.onclose = () => {
            state.disconnectClient(this);
        };
    };

    onMessage = (payload) => {
        const { type, data } = JSON.parse(payload.data);

        switch (type) {
            case CLIENT_TO_SERVER_MSG.UPDATE_STATE:
                this.onUpdateState(data);
                break;
            case CLIENT_TO_SERVER_MSG.EXCHANGE_IDENTIFIER:
                this.onExchangeIdentifier(data);
                break;
            case CLIENT_TO_SERVER_MSG.CONNECT_TO_STATE:
                this.onConnectToState(data);
                break;
            default:
                this.sendMessage({
                    type: SERVER_TO_CLIENT_MSG.ERROR,
                    data: {
                        message: 'Unsupported message type'
                    }
                });
                break;
        }
    }

    onUpdateState = ({ updates }) => {
        if (!this.state) {
            this.sendMessage({
                type: SERVER_TO_CLIENT_MSG.ERROR,
                data: {
                    message: 'You are not connected to any state',
                    type: SYNC_ERROR.UPDATE_STATE
                }
            });
        } else {
            this.state.mutate(updates, this.metadata);
        }
    }

    onExchangeIdentifier = ({ identifier }) => {
        if (!identifier) {
            this.sendMessage({
                type: SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_ERROR,
                data: {
                    message: 'No identifier supplied during identifier exchange',
                    type: SYNC_ERROR.IDENTIFIER_EXCHANGE
                }
            });
        } else {
            this.identifier = identifier;
            this.sendMessage({
                type: SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_SUCCESS,
                data: {
                    identifier
                }
            });
        }
    }

    onConnectToState = ({ stateIdentifier }) => {
        if (!stateIdentifier) {
            this.sendMessage({
                type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
                data: {
                    message: 'Tried to connect to state but no stateIdentifier was supplied',
                    type: SYNC_ERROR.CONNECT_TO_STATE
                }
            });
        }
        if (!this.identifier) {
            this.sendMessage({
                type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
                data: {
                    message: 'Identifier exchange must be done before connecting to a state',
                    type: SYNC_ERROR.CONNECT_TO_STATE
                }
            });
        }

        if (this.state) {
            this.state.disconnectClient(this);
        }

        this.server.connectToState({ socketClient: this, stateIdentifier });
    }

    sendMessage = (msg) => {
        this.socket.send(JSON.stringify(msg));
    }
}