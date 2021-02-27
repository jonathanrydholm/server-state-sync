import { Server } from 'ws';
import { createServer as createHttpServer } from 'http';
import { createServer as createHttpsServer } from 'https';
import StateManager from './StateManager';
import SocketClient from './SocketClient';
/** Description of StateSyncer */

var StateSyncer =
/** @private */

/** @private */

/** @private */

/**
 * Create a new StateSyncer instance.
 * @param {{ ssl: boolean, cert: Buffer, key: Buffer }} config - If ssl = true, cert and key must be supplied.
 */
function StateSyncer(config) {
  var _this = this;

  if (config === void 0) {
    config = {};
  }

  this.wss = null;
  this.serverInstance = null;
  this.stateManager = new StateManager();

  this.onUpgrade = function (request, socket, head) {
    _this._authenticateClient(request, function (metadata, success) {
      if (!success) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      _this.wss.handleUpgrade(request, socket, head, function (ws) {
        _this.wss.emit('connection', ws, metadata);
      });
    });
  };

  this._authenticateClient = function (_, callback) {
    callback();
  };

  this.useAuthorizationMiddleware = function (middleware) {
    _this._authenticateClient = middleware;
  };

  this.start = function (port) {
    _this.serverInstance.listen(port);
  };

  this.onConnection = function (socket, metadata) {
    new SocketClient(socket, _this, metadata);
  };

  this.createNewState = function (options) {
    return _this.stateManager.addState(options);
  };

  this.removeState = function (identifier) {
    _this.stateManager.removeState(identifier);
  };

  this.connectToState = function (_ref) {
    var socketClient = _ref.socketClient,
        stateIdentifier = _ref.stateIdentifier;

    _this.stateManager.connectToState({
      socketClient: socketClient,
      stateIdentifier: stateIdentifier
    });
  };

  var _config = config,
      ssl = _config.ssl,
      cert = _config.cert,
      key = _config.key;
  this.wss = new Server({
    noServer: true
  });
  this.wss.on('connection', this.onConnection);

  if (ssl) {
    if (!cert || !key) {
      throw new Error('cert and key are both required while using ssl');
    }

    var httpsServer = createHttpsServer({
      cert: cert,
      key: key
    });
    httpsServer.on('upgrade', this.onUpgrade);
    this.serverInstance = httpsServer;
  } else {
    var httpServer = createHttpServer();
    httpServer.on('upgrade', this.onUpgrade);
    this.serverInstance = httpServer;
  }
}
/** @private */
;

export { StateSyncer as default };
;