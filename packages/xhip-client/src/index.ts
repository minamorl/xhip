import "whatwg-fetch"
import * as WebSocket from "ws"

export class Client {
  socket: WebSocket
  constructor(public uri: string, public opts: { ssl: boolean }) {
  }
  exec = (ops: Array<any>) => {
    const body = JSON.stringify({
      '__xhip': true,
      'operations': Object.assign({}, ...ops)
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
    })
  }
  subscribe(context: (exec: (ops: Array<any>) => any) => void) {
    const prefix = this.opts.ssl ? 'wss' : 'ws'
    let isOpen = false
    this.socket = new WebSocket(prefix + "://" + new URL(this.uri).host + "/ws")
    const exec = (ops: Array<any>) => {
      this.socket.send(JSON.stringify({
        'operations': Object.assign({}, ...ops)
      }))
      return new Promise((resolve, reject) =>
        this.socket.on('message', msg => {
          return resolve(JSON.parse(msg))
        }))
    }
    this.socket.on('open', () => {
      context(exec)
    })
  }
}
