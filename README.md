# server-state-sync
The server-state-sync is used for managing multiple states in your server and allow clients to connect to them. Every time a client updates a state, those changes will automatically be broadcasted to all other clients also connected to that state. This is very useful for chatting applications, games, real-time editing with multiple editors and much more. This package is used for both backend and frontend applications.
## Installing
```
npm install server-state-sync
```
or
```
yarn add server-state-sync
```

## Server Side

### Minimal configuration

```
import { StateSyncer } from 'server-state-sync';

const PORT = 5000;
const stateSyncer = new StateSyncer();
stateSyncer.start(PORT);
```

### Creating a new state

```
const generatedStateIdentifier = stateSyncer.createNewState({
    initialValue: {
        someProperty: 'someValue'
    }
});
```
If not initialValue is given, an empty object will the default. This has to be of type object.

### Creating a new state with custom identifier

```
const stateIdentifier = stateSyncer.createNewState({
    identifier: 'stateIdentifier',
    initialValue: {
        someProperty: 'someValue'
    }
});
```
You can give the state a custom identifier, if not a random uuid v4 will be generated instead.

## Client Side
### Connect client to StateSyncer
```
import { Client } from 'server-state-sync';

const client = new Client();

await client.connect('ws://{host}:{PORT}');
```
Has to match the StateSyncer host and port
### Give the client an identifier
```
await client.exchangeIdentifier('clientIdentifier');
```
Make the client identify itself with a unique id.
### Make the client connect to a state in the StateSyncer
```
await client.connectToState('stateIdentifier');
```
Connect the client to a state of the StateSyncer. The stateIdentifier has to match a state identifier in the StateSyncer.
### Update State
```
client.updateState({
    property: 'value'
});

client.updateState({
    property: {
        ...client.getState().property,
        anotherProperty: 'anotherValue'
    }
});
```
Each state update will be sent to the StateSyncer to be synchronized and broadcasted to other connected clients
### Listen to state updates
```
client.addStateUpdateListener('listenerIdentifier', (newUpdates, previousUpdates, entireState) => {

        console.log(newUpdates, previousUpdates, entireState);

}, ['property']);
```
You can add multiple listeners that will listen to specific properties of the state. If you add 2 listeners with the same listenerIdentifier, only the latest one will be used. Very useful when dealing with react lifecycles.
### Remove state update listener
```
client.removeStateUpdateListener('listenerIdentifier');
```
### Get entire state
```
client.getState();
```
## Authorization (Client and Server side)
### Server side
```
stateSyncer.useAuthorizationMiddleware((request, callback) => {
    const valid = validateToken(request.headers.token);

    // if token is of type jwt for instance, you could decode it here and extract user information

    const userInformation = decode(request.headers.token);

    if (valid) {
        callback(userInformation, true);
    } else {
        callback(null, false);
    }
});
```
By calling this function, every time a client connects to the StateSyncer this function will run. You can validate your token here, extract details from that token and when you are all done, call the callback function with the first argument being the actual userInformation and the second one being wether the authorization has been successeful or not.
### Client side
```
await client.connect('ws://{host}:{PORT}', 'accessToken');
```
If your StateSyncer is using the authorizationMiddleware and you give this function a token, the authorizationMiddleware request object will have a header that is called token.
### Allow client to connect to state

```
stateSyncer.createNewState({
    allowClientConnecting: (userInformation) => {
        if (userInformation.permissions.includes('somePermission')) {
            return true;
        }
        return false;
    }
});
```
If you only want to allow specific users to connect to a state, you can do the above. Everytime a client tries to connect to a state, this function will run where you can extract the clients userInformation and perform some kind of validation on it. Returning true means the client is accepted.
## Intercept state changes (Server Side)
```
stateSyncer.createNewState({
    interceptStateUpdate: (update, userInformation) => {
        if (userInformation.permissions.includes('somePermission')) {
            return update;
        }
        return null;
    }
});
```
If you want to intercept state changes on a specific state, add the property above. This is useful if you would like to validate some data or manipulate it. If you return null, nothing will be stored in the state and nothing will be broadcasted to any other connected client.
## SSL
### Make StateSyncer run in SSL mode
```
const stateSyncer = new StateSyncer({
    ssl: true,
    cert: fs.readFileSync('/path/to/cert.pem'),
    key: fs.readFileSync('/path/to/key.pem')
});
```
If you want to run your StateSyncer in SSL mode, do the above. cert and key has to be supplied if you have set ssl: true.