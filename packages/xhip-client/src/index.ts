import "whatwg-fetch"

const ReconnectingWebSocket = require('reconnecting-websocket')

export class Client {
  socket: WebSocket
  subscriptions: any[] = []
  constructor(public uri: string, public opts: { ssl: boolean }) {
  }
  exec<T1>(ops: [Promise<T1>]): Promise<[T1]>
  exec<T1, T2>(ops: [Promise<T1>, Promise<T2>]): Promise<[T1, T2]>
  exec<T1, T2, T3>(ops: [Promise<T1>, Promise<T2>, Promise<T3>]): Promise<[T1, T2, T3]>
  exec<T1, T2, T3, T4>(ops: [Promise<T1>, Promise<T2>, Promise<T3>, Promise<T4>]): Promise<[T1, T2, T3, T4]>
  async exec(ops: Promise<any>[]) {
    const body = JSON.stringify({
      '__xhip': true,
      'operations': ops
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
    return await res.json()
  }
  get isSocketOpen() {
    return this.socket.readyState === WebSocket.OPEN
  }
  subscribe<T>(target: () => Promise<T>, receiver: (value: T) => void) {
    this.subscriptions.push({
      target,
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
        const { target } = x
        const { receiver } = x
        if (target.some((y: any) => allExecutedOperations.indexOf(y.key) !== -1)) {
          receiver(parsed)
        }
      }
    }
  }
}
