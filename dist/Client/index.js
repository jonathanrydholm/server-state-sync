"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _ws = _interopRequireDefault(require("ws"));

var _messageTypes = require("../messageTypes");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

/** Description of Client */
var Client = function Client() {
  var _this = this;

  (0, _classCallCheck2["default"])(this, Client);
  (0, _defineProperty2["default"])(this, "socket", null);
  (0, _defineProperty2["default"])(this, "state", {});
  (0, _defineProperty2["default"])(this, "stateUpdateListeners", []);
  (0, _defineProperty2["default"])(this, "connect", function (endpoint, accessToken) {
    _this.socket = new _ws["default"](endpoint, {
      headers: {
        token: accessToken
      }
    });
    _this.socket.onmessage = _this.onMessage;
    return new Promise(function (resolve, reject) {
      _this.socket.onopen = resolve;
      _this.socket.onerror = reject;
    });
  });
  (0, _defineProperty2["default"])(this, "exchangeIdentifier", function (identifier) {
    return new Promise(function (resolve, reject) {
      _this._onIdentifierExchangeSuccess = resolve;
      _this._onIdentifierExchangeError = reject;

      _this.sendMessage({
        type: _messageTypes.CLIENT_TO_SERVER_MSG.EXCHANGE_IDENTIFIER,
        data: {
          identifier: identifier
        }
      });
    });
  });
  (0, _defineProperty2["default"])(this, "connectToState", function (stateIdentifier) {
    return new Promise(function (resolve, reject) {
      _this._onStateConnectionEstablished = resolve;
      _this._onStateConnectionError = reject;

      _this.sendMessage({
        type: _messageTypes.CLIENT_TO_SERVER_MSG.CONNECT_TO_STATE,
        data: {
          stateIdentifier: stateIdentifier
        }
      });
    });
  });
  (0, _defineProperty2["default"])(this, "addStateUpdateListener", function (identifier, handler) {
    var properties = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
    _this.stateUpdateListeners = _this.stateUpdateListeners.filter(function (listener) {
      return listener.identifier !== identifier;
    });

    _this.stateUpdateListeners.push({
      identifier: identifier,
      handler: handler,
      properties: properties
    });
  });
  (0, _defineProperty2["default"])(this, "removeStateUpdateListener", function (identifier) {
    _this.stateUpdateListeners = _this.stateUpdateListeners.filter(function (listener) {
      return listener.identifier !== identifier;
    });
  });
  (0, _defineProperty2["default"])(this, "updateState", function (updates) {
    _this.sendMessage({
      type: _messageTypes.CLIENT_TO_SERVER_MSG.UPDATE_STATE,
      data: {
        updates: updates
      }
    });
  });
  (0, _defineProperty2["default"])(this, "onError", function (handler) {
    _this.socket.onerror = handler;
    _this._syncErrorHandler = handler;
  });
  (0, _defineProperty2["default"])(this, "onMessage", function (msg) {
    var _JSON$parse = JSON.parse(msg.data),
        type = _JSON$parse.type,
        data = _JSON$parse.data;

    switch (type) {
      case _messageTypes.SERVER_TO_CLIENT_MSG.STATE_UPDATED:
        _this.onStateUpdated(data);

        break;

      case _messageTypes.SERVER_TO_CLIENT_MSG.ERROR:
        _this.onServerError(data);

        break;

      case _messageTypes.SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ESTABLISHED:
        _this.onConnectedToState(data);

        break;

      case _messageTypes.SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR:
        _this._onStateConnectionError(data);

        break;

      case _messageTypes.SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_SUCCESS:
        _this._onIdentifierExchangeSuccess(data);

        break;

      case _messageTypes.SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_ERROR:
        _this._onIdentifierExchangeError(data);

        break;

      default:
        console.error('Unknown server message');
        break;
    }
  });
  (0, _defineProperty2["default"])(this, "onStateUpdated", function (_ref) {
    var updates = _ref.updates;
    var previousState = {};
    var updatedProperties = Object.keys(updates);
    updatedProperties.forEach(function (key) {
      previousState[key] = _this.state[key];
    });
    _this.state = _objectSpread(_objectSpread({}, _this.state), updates);

    _this.stateUpdateListeners.forEach(function (listener) {
      if (listener.properties.length > 0) {
        if (listener.properties.find(function (property) {
          return updates[property] !== undefined;
        })) {
          listener.handler(updates, previousState, _this.state);
        }
      } else {
        listener.handler(updates, previousState, _this.state);
      }
    });
  });
  (0, _defineProperty2["default"])(this, "onConnectedToState", function (_ref2) {
    var state = _ref2.state;
    _this.state = state;

    _this._onStateConnectionEstablished(state);
  });
  (0, _defineProperty2["default"])(this, "onServerError", function (err) {
    if (_this._syncErrorHandler) {
      _this._syncErrorHandler(err);
    }
  });
  (0, _defineProperty2["default"])(this, "sendMessage", function (msg) {
    if (_this.socket && _this.socket.readyState === _this.socket.OPEN) {
      _this.socket.send(JSON.stringify(msg));
    } else {
      console.error('State syncer is not connected');
    }
  });
  (0, _defineProperty2["default"])(this, "getState", function () {
    return _this.state;
  });
};

exports["default"] = Client;