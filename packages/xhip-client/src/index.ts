import "whatwg-fetch"

const createResponse = (parsed: any) => Object.assign({}, ...Object.keys(parsed).map(k => parsed[k]))

export class Client {
  socket: WebSocket
  subscriptions: any[] = []
  constructor(public uri: string, public opts: { ssl: boolean }) {
    const prefix = this.opts.ssl ? 'wss' : 'ws'
    this.socket = new WebSocket(prefix + "://" + new URL(this.uri).host + "/ws")
    this.socket.onmessage = (ev) => {
      const parsed = JSON.parse(ev.data)
      const allExecutedOperations = Object.keys(parsed)
      for (let x of this.subscriptions) {
        const { target } = x
        const { receiver } = x
        if (target.some((y: any) => allExecutedOperations.indexOf(y.key) !== -1)) {
          receiver(createResponse(parsed))
        }
      }
    }
  }
  exec = (ops: Array<any>) => {
    const body = JSON.stringify({
      '__xhip': true,
      'operations': ops
    })
    return fetch(this.uri, {
      headers: {
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'include',
      method: 'POST',
      body
    }).then(res => {
      if (res.status >= 400) return Promise.reject(res)
      return res.json()
    }).then(createResponse)
  }
  get isSocketOpen() {
    return this.socket.readyState === WebSocket.OPEN
  }
  subscribe(target: Array<any>, receiver: Function) {
    this.subscriptions.push({
      target,
      receiver
    })
  }
  send(ops: Array<any>): void {
    if(this.isSocketOpen) {
      this.socket.send(JSON.stringify({
        'operations': ops
      }))
    }
  }
}
