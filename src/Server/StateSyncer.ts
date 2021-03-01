import * as Ws from 'ws';
import * as net from 'net';
import * as Https from 'https';
import * as Http from 'http';
import { parse } from 'url';
import SocketClient from './SocketClient';
import StateManager from './StateManager';
import { StateConfiguration } from './State';

interface StateSyncerConfiguration {
    cert: Buffer,
    key: Buffer,
}

export default class StateSyncer<T, K> {

    private webSocketServer: Ws.Server;

    private externalServer: any;

    private stateManager: StateManager<T, K>;

    constructor(ssl?: StateSyncerConfiguration) {

        this.stateManager = new StateManager();
        this.webSocketServer = new Ws.Server({ noServer: true });
        this.webSocketServer.on('connection', this.onConnection);

        if (ssl) {
            this.externalServer = Https.createServer({cert: ssl.cert, key: ssl.key });
        } else {
            this.externalServer = Http.createServer();
        }
        this.externalServer.on('upgrade', this.onUpgrade);
    }

    private onUpgrade = (request: Http.IncomingMessage, socket: net.Socket, head: Buffer) => {
        this._authenticateClient(request, (clientInformation, success) => {
            if (!success) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }

            this.webSocketServer.handleUpgrade(request, socket, head, (ws: Ws) => {
                if (request.url) {
                    const clientIdentifier = parse(request.url, true).query.identifier;
                    if (clientIdentifier) {
                        this.webSocketServer.emit('connection', ws, clientInformation, clientIdentifier);
                    } else {
                        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                        socket.destroy();
                        return;
                    }
                }
            });
        });
    }

    private onConnection = (socket: WebSocket, clientInformation: K, identifier: string) => {
        new SocketClient(socket, this, clientInformation, identifier);
    }

    private _authenticateClient = (_: Http.IncomingMessage, callback: (clientInformation: any, success: any) => void) => {
        callback(null, true);
    }

    public useAuthorizationMiddleware = (middleWare: (_: Http.IncomingMessage, callback: (clientInformation: K, success: boolean) => void) => void) => {
        this._authenticateClient = middleWare;
    }

    /*
        Returns null if there is a state with the same identifier, else returns the identifier
    */
    public createState = (config: StateConfiguration<T, K>, identifier?: string): string | null => this.stateManager.addState(config, identifier);

    /*
        Returns true if state was deleted, false if it did not exist
    */
    public removeState = (stateIdentifier: string): boolean => this.stateManager.removeState(stateIdentifier);

    public removeAllStates = () => this.stateManager.removeAllStates();

    public connectToState = (socketClient: SocketClient<T, K>, stateIdentifier: string) => this.stateManager.connectToState(socketClient, stateIdentifier);

    public getValueOfState = (stateIdentifier: string): T | undefined => this.stateManager.getStateValue(stateIdentifier);

    public updateStateValue = (stateIdentifier: string, updates: Partial<T>, clientInformation: K): Boolean => this.stateManager.mutateState(stateIdentifier, updates, clientInformation);

    public start = (port: number): Promise<void | Error> => {
        return new Promise((resolve, reject) => {
            this.externalServer.on('error', reject)
            this.externalServer.listen(port, undefined, undefined, resolve);
        });
    }
}