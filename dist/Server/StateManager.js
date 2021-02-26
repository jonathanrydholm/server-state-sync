"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _uuid = require("uuid");

var _State = _interopRequireDefault(require("./State"));

var _messageTypes = require("../messageTypes");

var _errorTypes = require("../errorTypes");

var StateManager = function StateManager() {
  var _this = this;

  (0, _classCallCheck2["default"])(this, StateManager);
  (0, _defineProperty2["default"])(this, "states", {});
  (0, _defineProperty2["default"])(this, "addState", function (_ref) {
    var identifier = _ref.identifier,
        initialValue = _ref.initialValue,
        allowClientConnecting = _ref.allowClientConnecting,
        interceptStateUpdate = _ref.interceptStateUpdate;
    var stateIdentifier = identifier || (0, _uuid.v4)();
    var state = new _State["default"]({
      initialValue: initialValue,
      allowClientConnecting: allowClientConnecting,
      interceptStateUpdate: interceptStateUpdate,
      destructionHandler: function destructionHandler() {
        _this.removeState(stateIdentifier);
      }
    });
    _this.states[stateIdentifier] = state;
    return stateIdentifier;
  });
  (0, _defineProperty2["default"])(this, "removeState", function (identifier) {
    if (_this.states[identifier]) {
      delete _this.states[identifier];
    } else {
      console.warn("State with identifier ".concat(identifier, " does not exist"));
    }
  });
  (0, _defineProperty2["default"])(this, "connectToState", function (_ref2) {
    var socketClient = _ref2.socketClient,
        stateIdentifier = _ref2.stateIdentifier;

    if (_this.states[stateIdentifier]) {
      _this.states[stateIdentifier].connectClient(socketClient);
    } else {
      socketClient.sendMessage({
        type: _messageTypes.SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
        data: {
          message: "State with identifier ".concat(stateIdentifier, " does not exist"),
          type: _errorTypes.SYNC_ERROR.CONNECT_TO_STATE
        }
      });
    }
  });
};

exports["default"] = StateManager;