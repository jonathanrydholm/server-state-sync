import _extends from "@babel/runtime/helpers/extends";
import { SERVER_TO_CLIENT_MSG } from '../messageTypes';
import { SYNC_ERROR } from '../errorTypes';

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
  this.value = {};
  this.connectedClients = [];

  this.destructionHandler = function () {};

  this.connectClient = function (socketClient) {
    if (_this.allowClientConnecting(socketClient.metadata)) {
      _this.connectedClients.push(socketClient);

      socketClient.onStateConnected(_this);
      socketClient.sendMessage({
        type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ESTABLISHED,
        data: {
          state: _this.value
        }
      });
    } else {
      socketClient.sendMessage({
        type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
        data: {
          message: 'Tried to connect to state but was not allowed to',
          type: SYNC_ERROR.CONNECT_TO_STATE
        }
      });
    }
  };

  this.disconnectClient = function (socketClient) {
    _this.connectedClients = _this.connectedClients.filter(function (client) {
      return client.identifier !== socketClient.identifier;
    });

    if (_this.connectedClients.length === 0) {
      _this.destroy();
    }
  };

  this.mutate = function (updates, metadata) {
    var afterInterception = _this.interceptStateUpdate(updates, metadata);

    if (!afterInterception) {
      return;
    }

    _this.value = _extends({}, _this.value, afterInterception);

    _this.onStateUpdate(afterInterception);
  };

  this.onStateUpdate = function (updates) {
    _this.connectedClients.forEach(function (client) {
      client.sendMessage({
        type: SERVER_TO_CLIENT_MSG.STATE_UPDATED,
        data: {
          updates: updates
        }
      });
    });
  };

  this.destroy = function () {
    _this.destructionHandler();
  };

  this.value = initialValue;
  this.destructionHandler = destructionHandler;
  this.allowClientConnecting = allowClientConnecting;
  this.interceptStateUpdate = interceptStateUpdate;
}
/*
    Used to connect a client to this state
*/
;

export { State as default };