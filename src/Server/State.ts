import SocketClient from './SocketClient';
import { ServerToClientMessageTypes } from '../Constants';

export interface StateConfiguration<T, K> {
    initialValue: T,
    allowConnectingClient?: (clientInformation: K) => Boolean,
    interceptStateUpdate?: (updates: Partial<T>, clientInformation: K) => Partial<T> | null;
    selfDestruct?: (numberOfClients: number, timeOfCreation: Date) => Boolean,
    ttl?: number
}

export default class State<T, K> {

    private connectedClients: Array<SocketClient<T, K>> = [];

    private value: T;

    private timeOfCreation: Date;

    private allowConnectingClient: (clientInformation: K) => Boolean;

    private interceptStateUpdate: (updates: Partial<T>, clientInformation: K) => Partial<T> | null;

    private selfDestruct: (numberOfClients: number, timeOfCreation: Date) => Boolean;

    private destructionHandler: () => {};


    constructor(config: StateConfiguration<T, K>, destructionHandler: () => {}) {

        this.timeOfCreation = new Date();

        this.value = config.initialValue;
        this.interceptStateUpdate = config.interceptStateUpdate ? config.interceptStateUpdate : (updates) => updates;
        this.allowConnectingClient = config.allowConnectingClient ? config.allowConnectingClient : () => true;
        this.selfDestruct = config.selfDestruct ? config.selfDestruct : () => false;
        this.destructionHandler = destructionHandler;
    }

    public connectClient = (socketClient: SocketClient<T, K>): void => {
        if (this.allowConnectingClient(socketClient.clientInformation)) {
            this.connectedClients.push(socketClient);
            socketClient.onStateConnected(this);
        } else {
            socketClient.sendMessage({
                type: ServerToClientMessageTypes.STATE_CONNECTION_ERROR,
                data: {
                    message: 'Not allowed to connect to this state'
                }
            })
        }
    }

    public disconnectClient = (socketClient: SocketClient<T, K>): void => {
        this.connectedClients = this.connectedClients.filter(connectedClient => connectedClient.identifier !== socketClient.identifier);

        if (this.selfDestruct(this.connectedClients.length, this.timeOfCreation)) {
            this.destroy();
        }
    }

    public mutate = (updates: Partial<T>, clientInformation: K): Boolean => {
        const afterInterception = this.interceptStateUpdate(updates, clientInformation);

        if (afterInterception == null) {
            return false;
        }

        this.value = {
            ...this.value,
            ...afterInterception
        };

        this.broadcastStateUpdate(afterInterception);
        return true;
    }

    public broadcastStateUpdate = (updates: Partial<T>) => {
        this.connectedClients.forEach(socketClient => {
            socketClient.sendMessage({
                type: ServerToClientMessageTypes.STATE_UPDATED,
                data: {
                    updates
                }
            });
        })
    }

    public getState(): T {
        return this.value;
    }

    private destroy = () => {
        this.destructionHandler();
    }
}