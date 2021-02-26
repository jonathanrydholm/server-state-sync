"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ws = require("ws");

var _StateManager = _interopRequireDefault(require("./StateManager"));

var _SocketClient = _interopRequireDefault(require("./SocketClient"));

var WebSocketServer = function WebSocketServer(config) {
  var _this = this;

  (0, _classCallCheck2["default"])(this, WebSocketServer);
  (0, _defineProperty2["default"])(this, "stateManager", new _StateManager["default"]());
  (0, _defineProperty2["default"])(this, "onConnection", function (socket) {
    new _SocketClient["default"](socket, _this);
  });
  (0, _defineProperty2["default"])(this, "createNewState", function (_ref) {
    var identifier = _ref.identifier,
        initialValue = _ref.initialValue;
    return _this.stateManager.addState({
      identifier: identifier,
      initialValue: initialValue
    });
  });
  (0, _defineProperty2["default"])(this, "connectToState", function (_ref2) {
    var socketClient = _ref2.socketClient,
        stateIdentifier = _ref2.stateIdentifier;

    _this.stateManager.connectToState({
      socketClient: socketClient,
      stateIdentifier: stateIdentifier
    });
  });
  (0, _defineProperty2["default"])(this, "onError", function (e) {
    return console.error(e);
  });
  (0, _defineProperty2["default"])(this, "onClose", function () {});
  (0, _defineProperty2["default"])(this, "onListening", function () {
    return console.log('Server syncing started');
  });
  var serverInstance = new _ws.Server(config);
  serverInstance.on('connection', this.onConnection);
  serverInstance.on('error', this.onError);
  serverInstance.on('close', this.onClose);
  serverInstance.on('listening', this.onListening);
  serverInstance.on('headers', function () {});
};

exports["default"] = WebSocketServer;
;