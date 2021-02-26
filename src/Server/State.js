import { SERVER_TO_CLIENT_MSG } from '../messageTypes';
import { SYNC_ERROR } from '../errorTypes';

export default class State {

    value = {};

    connectedClients = [];

    destructionHandler = () => {};

    constructor({ initialValue = {}, destructionHandler, allowClientConnecting = () => true, interceptStateUpdate = (updates) => updates }) {
        this.value = initialValue;
        this.destructionHandler = destructionHandler;
        this.allowClientConnecting = allowClientConnecting;
        this.interceptStateUpdate = interceptStateUpdate;
    }

    /*
        Used to connect a client to this state
    */
    connectClient = (socketClient) => {
        if (this.allowClientConnecting(socketClient.metadata)) {
            this.connectedClients.push(socketClient);
            socketClient.onStateConnected(this);
            socketClient.sendMessage({
                type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ESTABLISHED,
                data: {
                    state: this.value
                }
            });
        } else {
            socketClient.sendMessage({
                type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
                data: {
                    message: 'Tried to connect to state but was not allowed to',
                    type: SYNC_ERROR.CONNECT_TO_STATE
                }
            });
        }

    }

    /*
        Used to disconnect a client from this state
    */
    disconnectClient = (socketClient) => {
        this.connectedClients = this.connectedClients.filter(client => client.identifier !== socketClient.identifier);

        if (this.connectedClients.length === 0) {
            this.destroy();
        }
    }

    /*
        Used to mutate the actual state
    */
    mutate = (updates, metadata) => {

        const afterInterception = this.interceptStateUpdate(updates, metadata);

        if (!afterInterception) {
            return;
        }

        this.value = {
            ...this.value,
            ...afterInterception,
        };
        this.onStateUpdate(afterInterception);
    }

    /*
        Used to broadcast the state update to all clients
    */
    onStateUpdate = (updates) => {
        this.connectedClients.forEach(client => {
            client.sendMessage({
                type: SERVER_TO_CLIENT_MSG.STATE_UPDATED,
                data: {
                    updates
                }
            });
        });
    }

    /*
        Used to clean up things
    */
    destroy = () => {
        this.destructionHandler();
    }
}