import { Server } from 'ws';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import StateManager from './StateManager';
import SocketClient from './SocketClient';
/** Description of StateSyncer */

export default class StateSyncer {
  /** @private */

  /** @private */

  /** @private */

  /**
   * Create a new StateSyncer instance.
   * @param {{ ssl: boolean, cert: Buffer, key: Buffer }} config - If ssl = true, cert and key must be supplied.
   */
  constructor(config = {}) {
    this.wss = null;
    this.serverInstance = null;
    this.stateManager = new StateManager();

    this.onUpgrade = (request, socket, head) => {
      this._authenticateClient(request, (metadata, success) => {
        if (!success) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        this.wss.handleUpgrade(request, socket, head, ws => {
          this.wss.emit('connection', ws, metadata);
        });
      });
    };

    this._authenticateClient = (_, callback) => {
      callback();
    };

    this.useAuthorizationMiddleware = middleware => {
      this._authenticateClient = middleware;
    };

    this.start = port => {
      this.serverInstance.listen(port);
    };

    this.onConnection = (socket, metadata) => {
      new SocketClient(socket, this, metadata);
    };

    this.createNewState = options => {
      return this.stateManager.addState(options);
    };

    this.removeState = identifier => {
      this.stateManager.removeState(identifier);
    };

    this.connectToState = ({
      socketClient,
      stateIdentifier
    }) => {
      this.stateManager.connectToState({
        socketClient,
        stateIdentifier
      });
    };

    const {
      ssl,
      cert,
      key
    } = config;
    this.wss = new Server({
      noServer: true
    });
    this.wss.on('connection', this.onConnection);

    if (ssl) {
      if (!cert || !key) {
        throw new Error('cert and key are both required while using ssl');
      }

      const httpsServer = createHttpsServer({
        cert,
        key
      });
      httpsServer.on('upgrade', this.onUpgrade);
      this.serverInstance = httpsServer;
    } else {
      const httpServer = createHttpServer();
      httpServer.on('upgrade', this.onUpgrade);
      this.serverInstance = httpServer;
    }
  }
  /** @private */


}
;