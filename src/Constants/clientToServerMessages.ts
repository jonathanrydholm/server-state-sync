export enum ClientToServerMessageTypes {
    EXCHANGE_IDENTIFIER = 1,
    CONNECT_TO_STATE = 2,
    UPDATE_STATE = 3,
}

export interface ClientToServerMessage {
    type: ClientToServerMessageTypes,
    data: Object | null | undefined
}