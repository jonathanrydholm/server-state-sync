import State from './State';
import StateSyncer from './StateSyncer';
import { ClientToServerMessageTypes, ClientToServerMessage, ServerToClientMessage, ServerToClientMessageTypes } from '../Constants';

export default class SocketClient<T, K> {

    identifier: string;

    clientInformation: K;

    socket: WebSocket;

    stateSyncer: StateSyncer<T, K>;

    state!: State<T, K>;

    constructor(socket: WebSocket, stateSyncer: StateSyncer<T, K>, clientInformation: K, identifier: string) {
        this.socket = socket;
        this.stateSyncer = stateSyncer;
        this.clientInformation = clientInformation;
        this.identifier = identifier;

        this.setUpEventListeners(socket);
    }

    private setUpEventListeners = (socket: WebSocket) => {
        socket.onopen = () => {};
        socket.onclose = () => {};
        socket.onerror = () => {};
        socket.onmessage = this.onMessage;
    }

    private onMessage = (event: globalThis.MessageEvent) => {
        try {
            const { data, type }: ClientToServerMessage = JSON.parse(event.data);

            switch (type) {
                case ClientToServerMessageTypes.UPDATE_STATE:
                    this.onStateUpdateRequest(data);
                    break;
                case ClientToServerMessageTypes.CONNECT_TO_STATE:
                    this.onConnectToStateRequest(data);
                    break;
                default:
                    this.sendMessage({
                        type: ServerToClientMessageTypes.UNSUPPORTED_MESSAGE_TYPE,
                        data: {
                            message: `Message type ${type} is not supported`
                        }
                    });
                    break;
            }

        } catch(e) {
            console.error(e);
        }
    }

    private onConnectToStateRequest = ({ stateIdentifier }: any) => {
        if (stateIdentifier) {
            if (this.state) {
                this.state.disconnectClient(this);
            }
            this.stateSyncer.connectToState(this, stateIdentifier);
        } else {
            this.sendMessage({
                type: ServerToClientMessageTypes.STATE_CONNECTION_ERROR,
                data: {
                    message: 'Could not connect to state, no stateIdentifier was supplied'
                }
            });
        }
    }

    private onStateUpdateRequest = ({ updates }: any) => {
        if (this.state && updates) {
            this.state.mutate(updates, this.clientInformation);
        } else {
            this.sendMessage({
                type: ServerToClientMessageTypes.STATE_UPDATE_FAILED,
                data: {
                    message: 'Could not update state'
                }
            });
        }
    }
    
    public onStateConnected = (state: State<T, K>) => {
        this.state = state;
        this.socket.onclose = () => state.disconnectClient(this);
        this.sendMessage({
            type: ServerToClientMessageTypes.STATE_CONNECTION_ESTABLISHED,
            data: {
                state: state.getState()
            }
        });
    }

    public sendMessage = (msg: ServerToClientMessage) => {
        this.socket.send(JSON.stringify(msg));
    }
}