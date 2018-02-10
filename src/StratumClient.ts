import { Socket } from "net"
import { promisify } from "util"

function createPromiseSocket() {
  const socket = new Socket()
  socket.connectp = promisify(socket.connect)
  return socket
}

export default class StratumClient {
  private socket = createPromiseSocket()
  private requestID = 0
  private methodListeners: {[index: number]: { resolve: Function, reject: Function }} = {}
  private nonIdListeners: {[index: string]: [Function]} = {}
  private closeListener: () => void
  private errorListener: (Error) => void

  constructor() {
    this.socket.setEncoding("utf8")

    this.socket.on("data", data => {
      data.toString()
        .split("\n")
        .filter(s => s.length > 0)
        .map(JSON.parse)
        .forEach(this.onData.bind(this))
    })

    this.socket.on("error", error => {
      if (this.errorListener) {
        this.errorListener(error)
      }
    })
    
    this.socket.on("close", () => {
      if (this.closeListener) {
        this.closeListener()
      }
    })
  }

  onData(json) {
    if (json.id !== null) {
      const listener = this.methodListeners[json.id]
      if (listener) {
        if (!json.result) {
          return listener.reject(json.error)
        }
        listener.resolve(json)
      }
      return
    }

    const listeners = this.nonIdListeners[json.method]
    if (listeners) {
      listeners.forEach(f => f(json))
    }
  }
  
  onSocketClose(callback: () => void) {
    this.closeListener = callback
  }

  onSocketError(callback: (Error) => void) {
    this.errorListener = callback
  }

  connect(port: number, host: string) {
    return this.socket.connectp(port, host)
  }

  private write(method: string, params: (string|number)[] = []) {
    const id = this.requestID
    const obj = { id, method, params }
    const data = JSON.stringify(obj) + "\n"
    this.socket.write(data)
    this.requestID++

    // on("data") で結果が返ってくるまで resolve, reject を保持しておく
    return new Promise((resolve, reject) => {
      this.methodListeners[id] = { resolve, reject }
    })
  }

  private observe(method, callback, transform = x => x) {
    if (!this.nonIdListeners[method]) {
      this.nonIdListeners[method] = [callback]
    } else {
      this.nonIdListeners[method].push(callback)
    }
  }

  authorize(workerName: string, workerPassword: string = "") {
    return this.write("mining.authorize", [workerName, workerPassword])
  }

  subscribe() {
    return this.write("mining.subscribe")
  }

  submit(workerName: string, jobID: string, extraNonce2: string, nTime: string, nOnce: string) {
    return this.write("mining.submit", [workerName, jobID, extraNonce2, nTime, nOnce])
  }

  getTransactions(jobID) {
    return this.write("mining.get_transactions", [jobID])
  }

  onSetDifficulty(callback) {
    this.observe("mining.set_difficulty", callback)
  }

  onNotify(callback) {
    this.observe("mining.notify", (result: {}) => {
      const [ jobID, prevhash, coinb1, coinb2, merkleBranches, version, nBits, nTime, clean ] = result.params
      callback({
        jobID, 
        prevhash, 
        coinb1, 
        coinb2,
        merkleBranches, 
        version, 
        nBits, 
        nTime, 
        clean
      })
    })
  }
}
