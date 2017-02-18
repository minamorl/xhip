import "whatwg-fetch"
import {OperationFunction} from "xhip"

const ReconnectingWebSocket = require('reconnecting-websocket')

export class Client {
  socket: WebSocket
  subscriptions: {key: string, receiver: (value: any) => void}[] = []
  constructor(public uri: string, public opts: { ssl: boolean }) {
  }
  async exec<T>(op: Promise<T>) {
    const body = JSON.stringify({
      '__xhip': true,
      'operation': op
    })
    const res = await fetch(this.uri, {
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'include',
      method: 'POST',
      body
    })
    if (res.status >= 400) {
      return Promise.reject(res)
    }
    const result = await res.json()
    return result as T
  }
  get isSocketOpen() {
    return this.socket.readyState === WebSocket.OPEN
  }
  subscribe<T>(target: (...args: any[]) => Promise<T>, receiver: (value: T) => void) {
    this.subscriptions.push({
      key: (target as any as OperationFunction).key,
      receiver
    })
  }
  send<T1>(ops: [Promise<T1>]): void
  send<T1, T2>(ops: [Promise<T1>, Promise<T2>]): void
  send<T1, T2, T3>(ops: [Promise<T1>, Promise<T2>, Promise<T3>]): void
  send<T1, T2, T3, T4>(ops: [Promise<T1>, Promise<T2>, Promise<T3>, Promise<T4>]): void
  send(ops: Promise<any>[]) {
    if(this.isSocketOpen) {
      this.socket.send(JSON.stringify({
        'operations': ops
      }))
    }
  }
  connect() {
    const prefix = this.opts.ssl ? 'wss' : 'ws'
    this.socket = new ReconnectingWebSocket(prefix + "://" + new URL(this.uri).host + "/ws")
    this.socket.onmessage = (ev) => {
      const parsed = JSON.parse(ev.data)
      const allExecutedOperations = Object.keys(parsed)
      for (let x of this.subscriptions) {
        const {key, receiver} = x
        if (parsed.hasOwnProperty(key)) {
          receiver(parsed[key])
        }
      }
    }
  }
}
