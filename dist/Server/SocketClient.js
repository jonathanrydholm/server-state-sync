import { CLIENT_TO_SERVER_MSG, SERVER_TO_CLIENT_MSG } from '../messageTypes';
import { SYNC_ERROR } from '../errorTypes';

var SocketClient = function SocketClient(socket, server, metadata) {
  var _this = this;

  this.identifier = null;
  this.server = null;
  this.socket = null;
  this.state = null;
  this.metadata = null;

  this.onOpen = function () {};

  this.onClose = function () {};

  this.onError = function () {};

  this.onStateConnected = function (state) {
    _this.state = state;

    _this.socket.onclose = function () {
      state.disconnectClient(_this);
    };
  };

  this.onMessage = function (payload) {
    var _JSON$parse = JSON.parse(payload.data),
        type = _JSON$parse.type,
        data = _JSON$parse.data;

    switch (type) {
      case CLIENT_TO_SERVER_MSG.UPDATE_STATE:
        _this.onUpdateState(data);

        break;

      case CLIENT_TO_SERVER_MSG.EXCHANGE_IDENTIFIER:
        _this.onExchangeIdentifier(data);

        break;

      case CLIENT_TO_SERVER_MSG.CONNECT_TO_STATE:
        _this.onConnectToState(data);

        break;

      default:
        _this.sendMessage({
          type: SERVER_TO_CLIENT_MSG.ERROR,
          data: {
            message: 'Unsupported message type'
          }
        });

        break;
    }
  };

  this.onUpdateState = function (_ref) {
    var updates = _ref.updates;

    if (!_this.state) {
      _this.sendMessage({
        type: SERVER_TO_CLIENT_MSG.ERROR,
        data: {
          message: 'You are not connected to any state',
          type: SYNC_ERROR.UPDATE_STATE
        }
      });
    } else {
      _this.state.mutate(updates, _this.metadata);
    }
  };

  this.onExchangeIdentifier = function (_ref2) {
    var identifier = _ref2.identifier;

    if (!identifier) {
      _this.sendMessage({
        type: SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_ERROR,
        data: {
          message: 'No identifier supplied during identifier exchange',
          type: SYNC_ERROR.IDENTIFIER_EXCHANGE
        }
      });
    } else {
      _this.identifier = identifier;

      _this.sendMessage({
        type: SERVER_TO_CLIENT_MSG.EXCHANGE_IDENTIFIER_SUCCESS,
        data: {
          identifier: identifier
        }
      });
    }
  };

  this.onConnectToState = function (_ref3) {
    var stateIdentifier = _ref3.stateIdentifier;

    if (!stateIdentifier) {
      _this.sendMessage({
        type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
        data: {
          message: 'Tried to connect to state but no stateIdentifier was supplied',
          type: SYNC_ERROR.CONNECT_TO_STATE
        }
      });
    }

    if (!_this.identifier) {
      _this.sendMessage({
        type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
        data: {
          message: 'Identifier exchange must be done before connecting to a state',
          type: SYNC_ERROR.CONNECT_TO_STATE
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
  };

  this.sendMessage = function (msg) {
    _this.socket.send(JSON.stringify(msg));
  };

  this.socket = socket;
  this.server = server;
  this.metadata = metadata;
  socket.onopen = this.onOpen;
  socket.onclose = this.onClose;
  socket.onerror = this.onError;
  socket.onmessage = this.onMessage;
};

export { SocketClient as default };