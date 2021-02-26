"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ws = require("ws");

var _http = require("http");

var _https = require("https");

var _StateManager = _interopRequireDefault(require("./StateManager"));

var _SocketClient = _interopRequireDefault(require("./SocketClient"));

/** Description of StateSyncer */
var StateSyncer =
/** @private */

/** @private */

/** @private */

/**
 * Create a new StateSyncer instance.
 * @param {{ ssl: boolean, cert: Buffer, key: Buffer }} config - If ssl = true, cert and key must be supplied.
 */
function StateSyncer() {
  var _this = this;

  var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  (0, _classCallCheck2["default"])(this, StateSyncer);
  (0, _defineProperty2["default"])(this, "wss", null);
  (0, _defineProperty2["default"])(this, "serverInstance", null);
  (0, _defineProperty2["default"])(this, "stateManager", new _StateManager["default"]());
  (0, _defineProperty2["default"])(this, "onUpgrade", function (request, socket, head) {
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
  });
  (0, _defineProperty2["default"])(this, "_authenticateClient", function (_, callback) {
    callback();
  });
  (0, _defineProperty2["default"])(this, "useAuthorizationMiddleware", function (middleware) {
    _this._authenticateClient = middleware;
  });
  (0, _defineProperty2["default"])(this, "start", function (port) {
    _this.serverInstance.listen(port);
  });
  (0, _defineProperty2["default"])(this, "onConnection", function (socket, metadata) {
    new _SocketClient["default"](socket, _this, metadata);
  });
  (0, _defineProperty2["default"])(this, "createNewState", function (options) {
    return _this.stateManager.addState(options);
  });
  (0, _defineProperty2["default"])(this, "removeState", function (identifier) {
    _this.stateManager.removeState(identifier);
  });
  (0, _defineProperty2["default"])(this, "connectToState", function (_ref) {
    var socketClient = _ref.socketClient,
        stateIdentifier = _ref.stateIdentifier;

    _this.stateManager.connectToState({
      socketClient: socketClient,
      stateIdentifier: stateIdentifier
    });
  });
  var ssl = config.ssl,
      cert = config.cert,
      key = config.key;
  this.wss = new _ws.Server({
    noServer: true
  });
  this.wss.on('connection', this.onConnection);

  if (ssl) {
    if (!cert || !key) {
      throw new Error('cert and key are both required while using ssl');
    }

    var httpsServer = (0, _https.createServer)({
      cert: cert,
      key: key
    });
    httpsServer.on('upgrade', this.onUpgrade);
    this.serverInstance = httpsServer;
  } else {
    var httpServer = (0, _http.createServer)();
    httpServer.on('upgrade', this.onUpgrade);
    this.serverInstance = httpServer;
  }
}
/** @private */
;

exports["default"] = StateSyncer;
;