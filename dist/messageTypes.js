"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SERVER_TO_CLIENT_MSG = exports.CLIENT_TO_SERVER_MSG = void 0;
var CLIENT_TO_SERVER_MSG = {
  EXCHANGE_IDENTIFIER: 1,
  CONNECT_TO_STATE: 2,
  UPDATE_STATE: 3
};
exports.CLIENT_TO_SERVER_MSG = CLIENT_TO_SERVER_MSG;
var SERVER_TO_CLIENT_MSG = {
  STATE_DOES_NOT_EXIST: 1,
  CONNECTED_TO_STATE: 2,
  STATE_UPDATED: 3,
  ERROR: 4,
  EXCHANGE_IDENTIFIER_SUCCESS: 5,
  EXCHANGE_IDENTIFIER_ERROR: 6,
  STATE_CONNECTION_ESTABLISHED: 7,
  STATE_CONNECTION_ERROR: 8
};
exports.SERVER_TO_CLIENT_MSG = SERVER_TO_CLIENT_MSG;