import { v4 as uuidv4 } from 'uuid';
import State, { StateConfiguration } from './State';
import SocketClient from './SocketClient';
import { ServerToClientMessageTypes } from '../Constants';

export default class StateManager<T, K> {

    states: Map<string, State<T, K>> = new Map();

    public addState = (config: StateConfiguration<T, K>, identifier?: string): string | null => {
        const stateIdentifier = identifier || uuidv4();
        if (this.states.has(stateIdentifier)) {
            return null;
        }
        const state = new State(config, () => this.removeState(stateIdentifier));
        this.states.set(stateIdentifier, state);
        return stateIdentifier;
    }

    public removeState = (identifier: string): boolean => this.states.delete(identifier);

    public connectToState = (socketClient: SocketClient<T, K>, stateIdentifier: string) => {
        const state = this.states.get(stateIdentifier);
        if (state) {
            state.connectClient(socketClient);
        } else {
            socketClient.sendMessage({
                type: ServerToClientMessageTypes.STATE_CONNECTION_ERROR,
                data: {
                    message: `State with identifier ${stateIdentifier} does not exist`
                }
            })
        }
    }

    public getStateValue (stateIdentifier: string): T | undefined {
        const state: State<T, K> | undefined = this.states.get(stateIdentifier);
        if (state) {
            return state.getState();
        }
    }

    public mutateState (stateIdentifier: string, updates: Partial<T>, clientInformation: K): Boolean {
        const state: State<T, K> | undefined = this.states.get(stateIdentifier);
        if (state) {
            return state.mutate(updates, clientInformation);
        }
        return false;
    }

    public removeAllStates = () => {
        this.states.forEach((_, key) => {
            this.removeState(key);
        });
    }
}