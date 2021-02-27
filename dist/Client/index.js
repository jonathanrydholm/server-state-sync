import _extends from "@babel/runtime/helpers/extends";
import Websocket from 'ws';
import { CLIENT_TO_SERVER_MSG, SERVER_TO_CLIENT_MSG } from '../messageTypes';
/** Description of Client */

var Client = function Client() {
  var _this = this;

  this.socket = null;
  this.state = {};
  this.stateUpdateListeners = [];

  this.connect = function (endpoint, accessToken) {
    _this.socket = new Websocket(endpoint, {
      headers: {
        token: accessToken
      }
    });
    _this.socket.onmessage = _this.onMessage;
    return new Promise(function (resolve, reject) {
      _this.socket.onopen = resolve;
      _this.socket.onerror = reject;
    });
  };

  this.exchangeIdentifier = function (identifier) {
    return new Promise(function (resolve, reject) {
      _this._onIdentifierExchangeSuccess = resolve;
      _this._onIdentifierExchangeError = reject;

      _this.sendMessage({
        type: CLIENT_TO_SERVER_MSG.EXCHANGE_IDENTIFIER,
        data: {
          identifier: identifier
        }
      });
    });
  };

  this.connectToState = function (stateIdentifier) {
    return new Promise(function (resolve, reject) {
      _this._onStateConnectionEstablished = resolve;
      _this._onStateConnectionError = reject;

      _this.sendMessage({
        type: CLIENT_TO_SERVER_MSG.CONNECT_TO_STATE,
        data: {
          stateIdentifier: stateIdentifier
        }
      });
    });
  };

  this.addStateUpdateListener = function (identifier, handler, properties) {
    if (properties === void 0) {
      properties = [];
    }

    _this.stateUpdateListeners = _this.stateUpdateListeners.filter(function (listener) {
      return listener.identifier !== identifier;
    });

    _this.stateUpdateListeners.push({
      identifier: identifier,
      handler: handler,
      properties: properties
    });
  };

  this.removeStateUpdateListener = function (identifier) {
    _this.stateUpdateListeners = _this.stateUpdateListeners.filter(function (listener) {
      return listener.identifier !== identifier;
    });
  };

  this.updateState = function (updates) {
    _this.sendMessage({
      type: CLIENT_TO_SERVER_MSG.UPDATE_STATE,
      data: {
        updates: updates
      }
    });
  };

  this.onError = function (handler) {
    _this.socket.onerror = handler;
    _this._syncErrorHandler = handler;
  };

  this.onMessage = function (msg) {
    var _JSON$parse = JSON.parse(msg.data),
        type = _JSON$parse.type,
        data = _JSON$parse.data;

    switch (type) {
      case SERVER_TO_CLIENT_MSG.STATE_UPDATED:
        _this.onStateUpdated(data);

        break;

      case SERVER_TO_CLIENT_MSG.ERROR:
        _this.onServerError(data);

        break;

      case SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ESTABLISHED:
        _this.onConnectedToState(data);

        break;

      case SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR:
        _this._onStateConnectionError(data);

        break;

      case SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_SUCCESS:
        _this._onIdentifierExchangeSuccess(data);

        break;

      case SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_ERROR:
        _this._onIdentifierExchangeError(data);

        break;

      default:
        console.error('Unknown server message');
        break;
    }
  };

  this.onStateUpdated = function (_ref) {
    var updates = _ref.updates;
    var previousState = {};
    var updatedProperties = Object.keys(updates);
    updatedProperties.forEach(function (key) {
      previousState[key] = _this.state[key];
    });
    _this.state = _extends({}, _this.state, updates);

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
  };

  this.onConnectedToState = function (_ref2) {
    var state = _ref2.state;
    _this.state = state;

    _this._onStateConnectionEstablished(state);
  };

  this.onServerError = function (err) {
    if (_this._syncErrorHandler) {
      _this._syncErrorHandler(err);
    }
  };

  this.sendMessage = function (msg) {
    if (_this.socket && _this.socket.readyState === _this.socket.OPEN) {
      _this.socket.send(JSON.stringify(msg));
    } else {
      console.error('State syncer is not connected');
    }
  };

  this.getState = function () {
    return _this.state;
  };
};

export { Client as default };