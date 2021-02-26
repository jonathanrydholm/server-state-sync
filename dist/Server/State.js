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

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var State = function State(_ref) {
  var _this = this;

  var _ref$initialValue = _ref.initialValue,
      initialValue = _ref$initialValue === void 0 ? {} : _ref$initialValue,
      destructionHandler = _ref.destructionHandler,
      _ref$allowClientConne = _ref.allowClientConnecting,
      allowClientConnecting = _ref$allowClientConne === void 0 ? function () {
    return true;
  } : _ref$allowClientConne,
      _ref$interceptStateUp = _ref.interceptStateUpdate,
      interceptStateUpdate = _ref$interceptStateUp === void 0 ? function (updates) {
    return updates;
  } : _ref$interceptStateUp;
  (0, _classCallCheck2["default"])(this, State);
  (0, _defineProperty2["default"])(this, "value", {});
  (0, _defineProperty2["default"])(this, "connectedClients", []);
  (0, _defineProperty2["default"])(this, "destructionHandler", function () {});
  (0, _defineProperty2["default"])(this, "connectClient", function (socketClient) {
    if (_this.allowClientConnecting(socketClient.metadata)) {
      _this.connectedClients.push(socketClient);

      socketClient.onStateConnected(_this);
      socketClient.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ESTABLISHED,
        data: {
          state: _this.value
        }
      });
    } else {
      socketClient.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
        data: {
          message: 'Tried to connect to state but was not allowed to',
          type: _errorTypes.SYNC_ERROR.CONNECT_TO_STATE
        }
      });
    }
  });
  (0, _defineProperty2["default"])(this, "disconnectClient", function (socketClient) {
    _this.connectedClients = _this.connectedClients.filter(function (client) {
      return client.identifier !== socketClient.identifier;
    });

    if (_this.connectedClients.length === 0) {
      _this.destroy();
    }
  });
  (0, _defineProperty2["default"])(this, "mutate", function (updates, metadata) {
    var afterInterception = _this.interceptStateUpdate(updates, metadata);

    if (!afterInterception) {
      return;
    }

    _this.value = _objectSpread(_objectSpread({}, _this.value), afterInterception);

    _this.onStateUpdate(afterInterception);
  });
  (0, _defineProperty2["default"])(this, "onStateUpdate", function (updates) {
    _this.connectedClients.forEach(function (client) {
      client.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.STATE_UPDATED,
        data: {
          updates: updates
        }
      });
    });
  });
  (0, _defineProperty2["default"])(this, "destroy", function () {
    _this.destructionHandler();
  });
  this.value = initialValue;
  this.destructionHandler = destructionHandler;
  this.allowClientConnecting = allowClientConnecting;
  this.interceptStateUpdate = interceptStateUpdate;
}
/*
    Used to connect a client to this state
*/
;

exports["default"] = State;