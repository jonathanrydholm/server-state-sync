import * as Http from 'http';
import SocketClient from './SocketClient';
import { StateCreationConfiguration } from '../../src/Server/StateManager';
import StateSyncer from '../../src/Server/StateSyncer';

export default class StateSyncerMock extends StateSyncer {

    public useAuthorizationMiddleware = (middleWare: (_: Http.IncomingMessage, callback: (clientInformation: any, success: boolean) => void) => void) => {
        
    }

    /*
        Returns null if there is a state with the same identifier, else returns the identifier
    */
    public createState = (config: StateCreationConfiguration = {}): string | null => null;

    /*
        Returns true if state was deleted, false if it did not exist
    */
    public removeState = (stateIdentifier: string): boolean => true;

    public connectToState = (socketClient: SocketClient, stateIdentifier: string) => {};

    public start = (port: number): Promise<void | Error> => {
        return new Promise((resolve, reject) => {});
    }
}