import { v4 as uuidv4 } from 'uuid';
import State from './State';
import { SERVER_TO_CLIENT_MSG } from '../messageTypes';
import { SYNC_ERROR } from '../errorTypes';

export default class StateManager {

    states = {};

    addState = ({ identifier, initialValue, allowClientConnecting, interceptStateUpdate }) => {
        const stateIdentifier = identifier || uuidv4();
        const state = new State({ 
            initialValue,
            allowClientConnecting,
            interceptStateUpdate,
            destructionHandler: () => {
                this.removeState(stateIdentifier);
            }
        });
        this.states[stateIdentifier] = state;
        return stateIdentifier;
    }

    removeState = (identifier) => {
        if (this.states[identifier]) {
            delete this.states[identifier];
        } else {
            console.warn(`State with identifier ${identifier} does not exist`);
        }
    }

    connectToState = ({ socketClient, stateIdentifier }) => {
        if (this.states[stateIdentifier]) {
            this.states[stateIdentifier].connectClient(socketClient);
        } else {
            socketClient.sendMessage({
                type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
                data: {
                    message: `State with identifier ${stateIdentifier} does not exist`,
                    type: SYNC_ERROR.CONNECT_TO_STATE
                }
            });
        }
    }
}