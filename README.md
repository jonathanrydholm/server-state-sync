# server-state-sync
The server-state-sync is used for managing multiple states server side and allow clients to connect to them. Every time a client updates a state, those changes will automatically be broadcasted to all other clients also connected to that state. This is very useful for chatting applications, games, real-time editing with multiple editors and much more.
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

```js
import { StateSyncer } from 'server-state-sync';

const PORT = 5000;
const stateSyncer = new StateSyncer();
stateSyncer.start(PORT).then(() => {});
```

### Creating a new state

```js
const generatedStateIdentifier = stateSyncer.createState(StateOptions);
```
If you do not give the state an identifier, a generated one will be returned.
If a state already exists with the same identifier, null will be returned.
### Creating a new state with custom identifier

```js
stateSyncer.createState({
    identifier: 'abc'
});
```
### Creating a new state with initial value

```js
stateSyncer.createState({
    initialValue: {
        property: 'value'
    }
});
```
### Remove a state
```js
stateSyncer.removeState('stateIdentifier');
```
### State lifecycles
```js
stateSyncer.createState({
    selfDestruct: (numberOfClientsLeft, timeOfCreation) => {
        if (numberOfClientsLeft === 0) {
            return true
        }
        return false;
    }
})

stateSyncer.createState({
    selfDestruct: (numberOfClientsLeft, timeOfCreation) => {
        if (new Date().getTime() - timeOfCreation.getTime() > 1000 * 60 * 60) {
            return true
        }
        return false;
    }
})
```
As default, a state will never be destroyed. You can however override this behaviour with the selfDestruct property.
First argument is the number of connected clients left, could be useful if you want to destroy your state if no clients are connected ot it anymore.
Second argument is the time of the state creation.
Returning true means the state will be destroyed. This function will be called everytime a client disconnects.
## Client Side
### Connect client to StateSyncer
```js
import { Client } from 'server-state-sync';

const client = new Client('ws://...', 'clientIdentifier', 'accessToken');
client.onConnection().then(() => {})
```
First argument is the endpoint of the StateSyncer. Second argument is a unique id for this client. Third argument is an optional access token that can be decoded/validated in the StateSyncer.
### Connect a client to a StateSyncer state
```js
client.connectToState('stateIdentifier').then(() => {});
```
### Update State property
```js
client.updateState({
    property: 'new value'
});
```
### Update nested state property
```js
client.updateState({
    property: {
        ...client.getState().property,
        nestedProperty: 'value'
    }
});
```
Each state update will be sent to the StateSyncer to be synchronized and broadcasted to other connected clients of this state.
### Listen to state updates
```js
client.addStateUpdateListener('listenerIdentifier', (newUpdates, previousValuesOfUpdatedProperties) => {
        console.log(newUpdates, previousValuesOfUpdatedProperties);
}, ['property']);
```
You can add multiple listeners that will listen to specific properties of the state. If you add 2 listeners with the same listenerIdentifier, only the latest one will be used. Very useful when dealing with react lifecycles.
### Remove state update listener
```js
client.removeStateUpdateListener('listenerIdentifier');
```
### Get entire state
```js
client.getState();
```
### Error handling
```js
client.onError().then((e) => console.error(e));
```
## Authorization
### Server side
```js
import url from 'url';

stateSyncer.useAuthorizationMiddleware((request, callback) => {
    // extract token
    const token = url.parse(request.url, true).query.token;

    //validate token
    const isValid = validateToken(token);

    if (isValid) {
        const clientInformation = getClientInfoFromToken(token);
        callback(clientInformation, true);
    } else {
        callback(null, false);
    }
});
```
By using this middleware, every time a client connects to the StateSyncer this function will run. You can validate your token here, extract details from that token and when you are all done, call the callback function with the first argument being some sort of data (maybe client information or permissions) and the second one being wether the authorization has been successeful or not.
### Allow client to connect to state

```js
stateSyncer.createState({
    allowConnectingClient: (clientInformation) => {
        if (clientInformation.permissions.includes('somePermission')) {
            return true;
        }
        return false;
    }
});
```
If you only want to allow specific users to connect to a state, you can do the above. This function will be called everytime a client tries to connect to a state. Returning true means the client is free to connect.
## Intercept state changes (Server Side)
```js
stateSyncer.createNewState({
    interceptStateUpdate: (updates, clientInformation) => {
        if (userInformation.permissions.includes('somePermission')) {
            return updates;
        }
        return null;
    }
});
```
If you want to intercept state changes on a specific state, use the interceptStateUpdate property. This is useful if you would like to validate some data, store the changes in a database, check for permissions or simply modify the data. If you return null, nothing will be stored and nothing will be broadcasted to any other connected clients.
## SSL
### Make StateSyncer run in SSL mode
```js
import fs from 'fs';

const stateSyncer = new StateSyncer({
    cert: fs.readFileSync('/path/to/cert.pem'),
    key: fs.readFileSync('/path/to/key.pem')
});
```
If you want to run your StateSyncer in SSL mode, simply give the constructor a cert and a key, it will automatically start in SSL mode.