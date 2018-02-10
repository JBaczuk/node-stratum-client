# node-stratum-client
Stratum protocol client for Node.js

## Install

```bash
$ npm install node-stratum-client --save
```

## How to use

```js
import StratumClient from "node-stratum-client"
const client = new StratumClient()
const POOL_PORT = 4233
const POOL_HOST = "example.com"
const WORKER_NAME = "ABCDabcd12345678"

client.onNotify(res => {
  console.log("notify", res)
})
client.onSetDifficulty(res => {
  console.log("set difficulty", res)
})
client.onSocketError(error => {
  console.error("socket error", error)
})
client.onSocketClose(() => {
  console.log("socket closed")
})
client.connect(POOL_PORT, POOL_HOST)
  .then(() => {
    console.log("connection successful")
    return client.authorize(WORKER_NAME)
  })
  .then(res => {
    console.log("authorize successful", res)
    return client.subscribe()
  })
  .then(res => {
    console.log("subscription successful", res)
    return client.getTransactions("0")
  })
  .then(res => {
    console.log("getTransactions successful", res)
  })
  .catch(error => {
    console.error("error", error)
  })
```

## Development

### Watch and build

```bash
$ npm start
```

### Run tests

```bash
$ npm run test
```
