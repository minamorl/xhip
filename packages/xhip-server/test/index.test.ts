import * as express from "express"
import * as http from "http"
import { Server } from "../src/index"
import "isomorphic-fetch"
import { assert } from "chai"
import { op, broadcast, request } from "xhip"
import * as WebSocket from "ws"

class TestBaseApp {
  @op showAppName() {
    return {
      "appName": "Xhip"
    }
  }
  @op echo(say: any) {
    return {say}
  }
  @op asyncfn() {
    return Promise.resolve({ supportAsync: "yes" })
  }
  @op ping() {
    (request as any)()
    return {
      "ping": "pong"
    }
  }
  @broadcast
  @op broadcaster() {
    return {
      "ping": "pong"
    }
  }
}
const testBaseApp = new TestBaseApp()
describe('Server', () => {
  let app: Server
  let socket: WebSocket
  beforeEach((done) => {
    app = new Server(testBaseApp, {})
    app.listen(0, () => {
      socket = new WebSocket(`ws://127.0.0.1:${app.server.address().port}/ws`)
      done()
    })
  })
  afterEach((done) => {
    app.server.close()
    done()
  })
  it('can be mounted with express app', () => {
    const server = express()
    server.use(new Server(testBaseApp, {}).app)
  })
  it('returns 400 when received without __ship signature', () => {
    return fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      method: 'POST'
    }).then((res) => {
      assert.strictEqual(res.status, 400)
    })
  })
  it('returns 200 with correct calls', () => {
    return fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        '__xhip': true,
      })
    }).then((res) => {
      assert.strictEqual(res.status, 200)
    })
  })
  it('returns transformed json', () => {
    return fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        '__xhip': true,
        operations: {
          showAppName: null,
          echo: "hi",
        }
      })
    }).then((res) => {
      assert.strictEqual(res.status, 200)
      return res.json().then(x => assert.deepEqual(x, {
        showAppName: {
          appName: "Xhip"
        }, 
        echo: {
          say: 'hi'
        }
      }))
    })
  })
  it('can handle async function', () => {
    return fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        '__xhip': true,
        operations: {
          echo: "hello",
        }
      })
    }).then((res) => {
      assert.strictEqual(res.status, 200)
      return res.json().then(x => assert.deepEqual(x, {
        echo: {
          say: "hello"
        }
      }))
    })
  })
  it('can open socket', (done) => {
    socket.on('open', () => {
      done()
    })
  })
  it('can handle WebSocket request', (done) => {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        operations: {
          echo: "hello",
        }
      }))
    })

    socket.on('message', msg => {
      assert.deepEqual(JSON.parse(msg), { echo: { say: "hello" }})
      done()
    })
  })
  it('can handle broadcast operation', (done) => {
    
    const ws2 = new WebSocket(`ws://127.0.0.1:${app.server.address().port}/ws`, {
      headers: {
        "Sec-WebSocket-Accept": "2",
      }
    })
    ws2.on('message', msg => {
      assert.deepEqual(JSON.parse(msg), { broadcaster: { ping: "pong" }})
      done()
    })
    
    ws2.on('open', () => {
      const ws1 = new WebSocket(`ws://127.0.0.1:${app.server.address().port}/ws`, {
        headers: {
          "Sec-WebSocket-Accept": "1",
        }
      })
      ws1.on('open', () => {
        ws1.send(JSON.stringify({
          operations: {
            broadcaster: "",
          }
        }))
      })
    })
  })
})
