import * as express from "express"
import * as http from "http"
import { Server } from "../src/index"
import "isomorphic-fetch"
import { assert } from "chai"
import { op, broadcast, Application } from "xhip"
import * as WebSocket from "ws"

class TestMixinMixin extends Application {
  @op async echo() {
    return {
      'this': 'is from TestMixinMixin'
    }
  }
}

class TestMixin extends Application {
  testMixinMixin = new TestMixinMixin
  @op async echo() {
    return {
      'this': 'is from TestMixin'
    }
  }
}

class TestBaseApp extends Application {
  testMixin = new TestMixin()
  @op async showAppName() {
    return {
      "appName": "Xhip"
    }
  }
  @op async echo(say: any) {
    return {say}
  }
  @op asyncfn() {
    return Promise.resolve({ supportAsync: "yes" })
  }
  @op async ping() {
    return {
      "ping": "pong"
    }
  }
  @broadcast
  @op async broadcaster() {
    return {
      "ping": "pong"
    }
  }
  @op async ip() {
    return {
      ip: this.req.ip
    }
  }
  @op async failing() {
    throw new Error("error!")
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
  it('returns 400 when received without __ship signature', async () => {
    const res = await fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      method: 'POST'
    })
    assert.strictEqual(res.status, 400)
  })
  it('returns 200 with correct calls', async () => {
    const res = await fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        '__xhip': true,
      })
    })
    assert.strictEqual(res.status, 200)
  })
  it('returns transformed json', async () => {
    const res = await fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        '__xhip': true,
        operation: testBaseApp.echo('hi'),
      })
    })
    assert.strictEqual(res.status, 200)
    const json = await res.json()
    assert.deepEqual(json, {
      result: {
        say: 'hi'
      }
    })
  })
  it('returns error if error occured in op', async () => {
    const res = await fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        '__xhip': true,
        operation: testBaseApp.failing()
      })
    })
    assert.strictEqual(res.status, 200)
    const json = await res.json()
    assert.deepEqual(json, {
      error: {
        name: "Error",
        message: "error!"
      }
    })
  })
  it('can replace req object as actual one', async () => {
    const res = await fetch(`http://127.0.0.1:${app.server.address().port}/`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        '__xhip': true,
        'operation': testBaseApp.ip(),
      })
    })
    assert.strictEqual(res.status, 200)
    const json = await res.json()
    assert.deepEqual(json, {
      result: {
        ip: "::ffff:127.0.0.1"
      }
    })
  })
  it('can search mixins', () => {
    const fn = app.lookupOperationFunction('TestMixin', 'echo')
    assert.isFunction(fn!)
  })
  it('can search chained mixins', () => {
    const fn = app.lookupOperationFunction('TestMixinMixin', 'echo')
    assert.isFunction(fn!)
  })
  it('returns null when mixins are not there', () => {
    const fn = app.lookupOperationFunction('TestMixinMixinFakeMixin', 'echo')
    assert.isNull(fn!)
  })
  it('can open socket', (done) => {
    socket.on('open', () => {
      done()
    })
  })
  it('can handle WebSocket request', (done) => {
    socket.on('open', () => {
      socket.send(JSON.stringify({
        operation: testBaseApp.echo('hello')
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
          operation: testBaseApp.broadcaster()
        }))
      })
    })
  })
})
