export enum ServerToClientMessageTypes {
    STATE_DOES_NOT_EXIST = 1,
    CONNECTED_TO_STATE = 2,
    STATE_UPDATED = 3,
    ERROR = 4,
    EXCHANGE_IDENTIFIER_SUCCESS = 5,
    EXCHANGE_IDENTIFIER_ERROR = 6,
    STATE_CONNECTION_ESTABLISHED = 7,
    STATE_CONNECTION_ERROR = 8,
    STATE_UPDATE_FAILED = 9,
    UNSUPPORTED_MESSAGE_TYPE = 10
}

export interface ServerToClientMessage {
    type: ServerToClientMessageTypes,
    data: Object | null | undefined
}