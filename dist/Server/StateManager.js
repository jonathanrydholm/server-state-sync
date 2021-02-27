import { v4 as uuidv4 } from 'uuid';
import State from './State';
import { SERVER_TO_CLIENT_MSG } from '../messageTypes';
import { SYNC_ERROR } from '../errorTypes';

var StateManager = function StateManager() {
  var _this = this;

  this.states = {};

  this.addState = function (_ref) {
    var identifier = _ref.identifier,
        initialValue = _ref.initialValue,
        allowClientConnecting = _ref.allowClientConnecting,
        interceptStateUpdate = _ref.interceptStateUpdate;
    var stateIdentifier = identifier || uuidv4();
    var state = new State({
      initialValue: initialValue,
      allowClientConnecting: allowClientConnecting,
      interceptStateUpdate: interceptStateUpdate,
      destructionHandler: function destructionHandler() {
        _this.removeState(stateIdentifier);
      }
    });
    _this.states[stateIdentifier] = state;
    return stateIdentifier;
  };

  this.removeState = function (identifier) {
    if (_this.states[identifier]) {
      delete _this.states[identifier];
    } else {
      console.warn("State with identifier " + identifier + " does not exist");
    }
  };

  this.connectToState = function (_ref2) {
    var socketClient = _ref2.socketClient,
        stateIdentifier = _ref2.stateIdentifier;

    if (_this.states[stateIdentifier]) {
      _this.states[stateIdentifier].connectClient(socketClient);
    } else {
      socketClient.sendMessage({
        type: SERVER_TO_CLIENT_MSG.STATE_CONNECTION_ERROR,
        data: {
          message: "State with identifier " + stateIdentifier + " does not exist",
          type: SYNC_ERROR.CONNECT_TO_STATE
        }
      });
    }
  };
};

export { StateManager as default };