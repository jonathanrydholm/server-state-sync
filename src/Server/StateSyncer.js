import { Server } from 'ws';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import StateManager from './StateManager';
import SocketClient from './SocketClient';

/** Description of StateSyncer */
export default class StateSyncer {

    /** @private */
    wss = null;

    /** @private */
    serverInstance = null;

    /** @private */
    stateManager = new StateManager();

    /**
     * Create a new StateSyncer instance.
     * @param {{ ssl: boolean, cert: Buffer, key: Buffer }} config - If ssl = true, cert and key must be supplied.
     */
    constructor(config = {}) {
        const { ssl, cert, key } = config;
        this.wss = new Server({ noServer: true });
        this.wss.on('connection', this.onConnection); 

        if (ssl) {
            if (!cert || !key) {
                throw new Error('cert and key are both required while using ssl');
            }
            const httpsServer = createHttpsServer({ cert, key });
            httpsServer.on('upgrade', this.onUpgrade);
            this.serverInstance = httpsServer;
        } else {
            const httpServer = createHttpServer();
            httpServer.on('upgrade', this.onUpgrade);
            this.serverInstance = httpServer;
        }
    }

    /** @private */
    onUpgrade = (request, socket, head) => {
        this._authenticateClient(request, (metadata, success) => {
            if (!success) {
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
                return;
            }
            this.wss.handleUpgrade(request, socket, head, (ws) => {
                this.wss.emit('connection', ws, metadata);
            });
        });
    }

    /** @private */
    _authenticateClient = (_, callback) => {
        callback();
    }

    /**
     * StateSyncer.useAuthorizationMiddleware.
     * @param {function(Request, function(any, boolean)):void} middleware - A function with 2 arguments. First one
     * is the upgrade request. Using this you can extract request information such as cookies. Second one is a callback(clientInfo, success).
     * @example
     * const middleware = (request, callback) => {
     *   const token = parseCookies(request)['access-token'];
     *   try {
     *     const decoded = decodeToken(token);
     *     callback(decoded.permissions, true);  // authorization successeful
     *   } catch {
     *     callback(null, false); // authorization failed
     *   }
     * });
     */
    useAuthorizationMiddleware = (middleware) => {
        this._authenticateClient = middleware;
    }

    /**
     * StateSyncer.start.
     * @param {number} port - The port to run the syncer on
     */
    start = (port) => {
        this.serverInstance.listen(port);
    }

    /** @private */
    onConnection = (socket, metadata) => {
        new SocketClient(socket, this, metadata);
    }

    /**
     * StateSyncer.createNewState.
     * @param {{ identifier: String, initialValue: object, allowClientConnecting: function(object):void, interceptStateUpdate: function(object, object):void }} options - State options
     * @return {String} identifier of the state
     */
    createNewState = (options) => {
        return this.stateManager.addState(options);
    }
    
    /**
     * StateSyncer.removeState.
     * @param {{ identifier: String} identifier - identifier of the state
     */
    removeState = (identifier) => {
        this.stateManager.removeState(identifier);
    }

    /** @private */
    connectToState = ({ socketClient, stateIdentifier }) => {
        this.stateManager.connectToState({ socketClient, stateIdentifier });
    };
};