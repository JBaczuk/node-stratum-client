const StratumClient = require("../bin/index")
const client = new StratumClient()

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
client.connect(4233, "asia1.gobyte.network")
  .then(() => {
    console.log("connection successful")
    return client.authorize("GaBcewa6gUrNZHYnLCBsjQbMrUnYQHKi9b")
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
