import { v4 as uuidv4 } from 'uuid';
import State, { StateConfiguration } from './State';
import SocketClient from './SocketClient';
import { ServerToClientMessageTypes } from '../Constants';

export interface StateCreationConfiguration extends StateConfiguration {
    identifier?: string
}

export default class StateManager {

    states: Map<string, State> = new Map();

    public addState = (config: StateCreationConfiguration): string | null => {
        const stateIdentifier = config.identifier || uuidv4();
        if (this.states.has(stateIdentifier)) {
            return null;
        }
        const state = new State({
            ...config,
        }, () => this.removeState(stateIdentifier));
        this.states.set(stateIdentifier, state);
        return stateIdentifier;
    }

    public removeState = (identifier: string): boolean => this.states.delete(identifier);

    public connectToState = (socketClient: SocketClient, stateIdentifier: string) => {
        if (this.states.has(stateIdentifier)) {
            this.states.get(stateIdentifier)?.connectClient(socketClient);
        } else {
            socketClient.sendMessage({
                type: ServerToClientMessageTypes.STATE_CONNECTION_ERROR,
                data: {
                    message: `State with identifier ${stateIdentifier} does not exist`
                }
            })
        }
    }

    public getStateValue = (stateIdentifier: string): Object | undefined => {
        const state: State | undefined = this.states.get(stateIdentifier);
        if (state) {
            return state.getState();
        }
    }

    public mutateState = (stateIdentifier: string, updates: Object, clientInformation: any) => {
        const state: State | undefined = this.states.get(stateIdentifier);
        if (state) {
            return state.mutate(updates, clientInformation);
        }
    }

    public removeAllStates = () => {
        this.states.forEach((_, key) => {
            this.removeState(key);
        });
    }
}