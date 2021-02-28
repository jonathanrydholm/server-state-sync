import SocketClient from './SocketClient';
import { ServerToClientMessageTypes } from '../Constants';

export interface StateConfiguration {
    initialValue?: Object,
    allowConnectingClient?: (clientInformation: any) => Boolean,
    interceptStateUpdate?: (updates: Object, clientInformation: any) => Object | null,
    selfDestruct?: (numberOfClients: number, timeSinceCreation: Date) => Boolean,
    ttl?: number
}

interface DefaultStateConfiguration extends StateConfiguration {
    initialValue: Object,
    allowConnectingClient: (clientInformation: any) => Boolean,
    interceptStateUpdate: (updates: Object, clientInformation: any) => Object | null,
    selfDestruct: (numberOfClients: number, timeSinceCreation: Date) => Boolean,
    ttl: number
}

export default class State {

    private value: Object = {};

    private connectedClients: Array<SocketClient> = [];
    
    private config: DefaultStateConfiguration = {
        initialValue: {},
        allowConnectingClient: () => true,
        interceptStateUpdate: (updates: any) => updates,
        selfDestruct: (_: number, __: Date) => false,
        ttl: 0
    };

    private destructionHandler: () => void;

    private timeOfCreation: Date;

    constructor(config: StateConfiguration, destructionHandler: () => void) {

        this.timeOfCreation = new Date();

        this.config = {
            ...this.config,
            ...config,
        };

        this.destructionHandler = destructionHandler;

        this.handleConfiguration(config);
    }

    private handleConfiguration = (config: StateConfiguration) => {
        if (config.initialValue) {
            this.value = config.initialValue;
        }

        if (config.ttl && config.ttl > 0) {
            setTimeout(this.destroy, config.ttl);
        }
    }

    public connectClient = (socketClient: SocketClient): void => {
        if (this.config.allowConnectingClient(socketClient.clientInformation)) {
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

    public disconnectClient = (socketClient: SocketClient): void => {
        this.connectedClients = this.connectedClients.filter(connectedClient => connectedClient.identifier !== socketClient.identifier);

        if (this.config.selfDestruct(this.connectedClients.length, this.timeOfCreation)) {
            this.destroy();
        }
    }

    public mutate = (updates: Object, clientInformation: any): void => {
        const afterInterception = this.config.interceptStateUpdate(updates, clientInformation);

        if (afterInterception == null) {
            return;
        }

        this.value = {
            ...this.value,
            ...afterInterception
        };

        this.broadcastStateUpdate(afterInterception);
    }

    public broadcastStateUpdate = (updates: Object) => {
        this.connectedClients.forEach(socketClient => {
            socketClient.sendMessage({
                type: ServerToClientMessageTypes.STATE_UPDATED,
                data: {
                    updates
                }
            });
        })
    }

    public getState = (): Object => this.value;

    private destroy = () => {
        this.destructionHandler();
    }
}