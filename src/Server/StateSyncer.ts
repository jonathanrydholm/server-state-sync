import * as Ws from 'ws';
import * as net from 'net';
import * as Https from 'https';
import * as Http from 'http';
import { parse } from 'url';
import SocketClient from './SocketClient';
import StateManager, { StateCreationConfiguration } from './StateManager';

interface StateSyncerConfiguration {
    cert: Buffer,
    key: Buffer,
}

export default class StateSyncer {

    private webSocketServer: Ws.Server;

    private externalServer: any;

    private stateManager: StateManager;

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
        request.url
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

    private onConnection = (socket: WebSocket, clientInformation: any, identifier: string) => {
        new SocketClient(socket, this, clientInformation, identifier);
    }

    private _authenticateClient = (_: Http.IncomingMessage, callback: (clientInformation: any, success: boolean) => void) => {
        callback(null, true);
    }

    public useAuthorizationMiddleware = (middleWare: (_: Http.IncomingMessage, callback: (clientInformation: any, success: boolean) => void) => void) => {
        this._authenticateClient = middleWare;
    }

    /*
        Returns null if there is a state with the same identifier, else returns the identifier
    */
    public createState = (config: StateCreationConfiguration = {}): string | null => this.stateManager.addState(config);

    /*
        Returns true if state was deleted, false if it did not exist
    */
    public removeState = (stateIdentifier: string): boolean => this.stateManager.removeState(stateIdentifier);

    public connectToState = (socketClient: SocketClient, stateIdentifier: string) => this.stateManager.connectToState(socketClient, stateIdentifier);

    public start = (port: number): Promise<void | Error> => {
        return new Promise((resolve, reject) => {
            this.externalServer.on('error', reject)
            this.externalServer.listen(port, undefined, undefined, resolve);
        });
    }
}