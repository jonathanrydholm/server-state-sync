import { ClientToServerMessageTypes, ServerToClientMessageTypes } from '../Constants';

export default class Client {

    private socket: WebSocket;

    private state: any;

    private stateUpdateListeners: Array<{ identifier: string, handler: (updates: any, previousUpdates: any) => void, properties: Array<string> }> = [];

    constructor(endpoint: string, identifier: string, accessToken?: string) {
        this.state = new Map();
        this.socket = new WebSocket(`${endpoint}?identifier=${identifier}&token=${accessToken || ''}`);
        this.socket.onmessage = this.onMessage;
    };

    public addStateUpdateListener = (identifier: string, handler: (updates: any, previousUpdates: any) => void, properties: Array<string> = [] ) => {
        this.stateUpdateListeners = this.stateUpdateListeners.filter(listener => listener.identifier !== identifier);

        this.stateUpdateListeners.push({
            identifier,
            handler,
            properties
        });
    }

    public removeStateUpdateListener = (identifier: string) => {
        this.stateUpdateListeners = this.stateUpdateListeners.filter(listener => listener.identifier !== identifier);
    };

    private onMessage = (event: any) => {
        const { type, data } = JSON.parse(event.data)

        switch (type) {
            case ServerToClientMessageTypes.STATE_UPDATED:
                this.onStateUpdated(data.updates);
                break;
            case ServerToClientMessageTypes.STATE_CONNECTION_ESTABLISHED:
                this.state = data.state;
                this._onStateConnectionEstablished(data.state);
                break;
            case ServerToClientMessageTypes.STATE_CONNECTION_ERROR:
                this._onStateConnectionError(data);
                break;
            default:
                break;
        }
    }

    public connectToState = (stateIdentifier: string) => {
        return new Promise((resolve, reject) => {
            this._onStateConnectionEstablished = resolve;
            this._onStateConnectionError = reject;

            this.sendMesage({
                type: ClientToServerMessageTypes.CONNECT_TO_STATE,
                data: {
                    stateIdentifier
                }
            });
        });
    }

    public updateState = (updates: object) => {
        this.sendMesage({
            type: ClientToServerMessageTypes.UPDATE_STATE,
            data: {
                updates
            }
        });
    };

    public onConnection = () => new Promise((resolve) => {
        this.socket.onopen = resolve;
    });

    public onError = () => new Promise((resolve) => {
        this.socket.onerror = resolve;
    });

    public getState = (): any => this.state;

    private onStateUpdated = (updates: any) => {

        const previousState: any = {};
        
        Object.keys(updates).forEach(key => {
            previousState[key] = this.state[key];
            this.state[key] = updates[key];
        });

        this.stateUpdateListeners.forEach(listener => {
            if (listener.properties.length > 0) {
                if (listener.properties.find(property => updates[property] !== undefined)) {
                    listener.handler(updates, previousState);
                }
            } else {
                listener.handler(updates, previousState);
            }
        });
    };

    private sendMesage = (msg: Object) => {
        if (this.socket && this.socket.readyState === this.socket.OPEN) {
            this.socket.send(JSON.stringify(msg));
        } else {
            console.error('Not connected to StateSyncer');
        }
    }

    private _onStateConnectionEstablished = (_: any): any => {};
    private _onStateConnectionError = (_: any): any => {};
}