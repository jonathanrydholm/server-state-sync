"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _messageTypes = require("../messageTypes");

var _errorTypes = require("../errorTypes");

var SocketClient = function SocketClient(socket, server, metadata) {
  var _this = this;

  (0, _classCallCheck2["default"])(this, SocketClient);
  (0, _defineProperty2["default"])(this, "identifier", null);
  (0, _defineProperty2["default"])(this, "server", null);
  (0, _defineProperty2["default"])(this, "socket", null);
  (0, _defineProperty2["default"])(this, "state", null);
  (0, _defineProperty2["default"])(this, "metadata", null);
  (0, _defineProperty2["default"])(this, "onOpen", function () {});
  (0, _defineProperty2["default"])(this, "onClose", function () {});
  (0, _defineProperty2["default"])(this, "onError", function () {});
  (0, _defineProperty2["default"])(this, "onStateConnected", function (state) {
    _this.state = state;

    _this.socket.onclose = function () {
      state.disconnectClient(_this);
    };
  });
  (0, _defineProperty2["default"])(this, "onMessage", function (payload) {
    var _JSON$parse = JSON.parse(payload.data),
        type = _JSON$parse.type,
        data = _JSON$parse.data;

    switch (type) {
      case _messageTypes.CLIENT_TO_SERVER_MSG.UPDATE_STATE:
        _this.onUpdateState(data);

        break;

      case _messageTypes.CLIENT_TO_SERVER_MSG.EXCHANGE_IDENTIFIER:
        _this.onExchangeIdentifier(data);

        break;

      case _messageTypes.CLIENT_TO_SERVER_MSG.CONNECT_TO_STATE:
        _this.onConnectToState(data);

        break;

      default:
        _this.sendMessage({
          type: _messageTypes.SERVER_TO_CLIENT_MSG.ERROR,
          data: {
            message: 'Unsupported message type'
          }
        });

        break;
    }
  });
  (0, _defineProperty2["default"])(this, "onUpdateState", function (_ref) {
    var updates = _ref.updates;

    if (!_this.state) {
      _this.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.ERROR,
        data: {
          message: 'You are not connected to any state',
          type: _errorTypes.SYNC_ERROR.UPDATE_STATE
        }
      });
    } else {
      _this.state.mutate(updates, _this.metadata);
    }
  });
  (0, _defineProperty2["default"])(this, "onExchangeIdentifier", function (_ref2) {
    var identifier = _ref2.identifier;

    if (!identifier) {
      _this.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_ERROR,
        data: {
          message: 'No identifier supplied during identifier exchange',
          type: _errorTypes.SYNC_ERROR.IDENTIFIER_EXCHANGE
        }
      });
    } else {
      _this.identifier = identifier;

      _this.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_SUCCESS,
        data: {
          identifier: identifier
        }
      });
    }
  });
  (0, _defineProperty2["default"])(this, "onConnectToState", function (_ref3) {
    var stateIdentifier = _ref3.stateIdentifier;

    if (!stateIdentifier) {
      _this.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
        data: {
          message: 'Tried to connect to state but no stateIdentifier was supplied',
          type: _errorTypes.SYNC_ERROR.CONNECT_TO_STATE
        }
      });
    }

    if (!_this.identifier) {
      _this.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
        data: {
          message: 'Identifier exchange must be done before connecting to a state',
          type: _errorTypes.SYNC_ERROR.CONNECT_TO_STATE
        }
      });
    }

    if (_this.state) {
      _this.state.disconnectClient(_this);
    }

    _this.server.connectToState({
      socketClient: _this,
      stateIdentifier: stateIdentifier
    });
  });
  (0, _defineProperty2["default"])(this, "sendMessage", function (msg) {
    _this.socket.send(JSON.stringify(msg));
  });
  this.socket = socket;
  this.server = server;
  this.metadata = metadata;
  socket.onopen = this.onOpen;
  socket.onclose = this.onClose;
  socket.onerror = this.onError;
  socket.onmessage = this.onMessage;
};

exports["default"] = SocketClient;