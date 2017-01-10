import * as express from "express"
import * as http from "http"
import { Server } from "../src/index"
import "isomorphic-fetch"
import { assert } from "chai"
import { op } from "xhip"

class TestBaseApp {
  @op showAppName() {
    return {
      "appName": "Xhip"
    }
  }
  @op echo(say: any) {
    return {say}
  }
}
const testBaseApp = new TestBaseApp()
describe('Server', () => {
  let app: express.Application
  let server: http.Server
  beforeEach((done) => {
    app = new Server(testBaseApp, {}).app
    server = http.createServer(app)
    server.listen(0, done)
  })
  afterEach((done) => {
    server.close(done)
  })
  it('can be mounted with express app', () => {
    const server = express()
    server.use(new Server(testBaseApp, {}).app)
  })
  it('returns 400 when received without __ship signature', () => {
    return fetch(`http://127.0.0.1:${server.address().port}/`, {
      method: 'POST'
    }).then((res) => {
      assert.strictEqual(res.status, 400)
    })
  })
  it('returns 200 with correct calls', () => {
    return fetch(`http://127.0.0.1:${server.address().port}/`, {
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
    return fetch(`http://127.0.0.1:${server.address().port}/`, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        '__xhip': true,
        operations: {
          showAppName: null,
          echo: "hi"
        }
      })
    }).then((res) => {
      assert.strictEqual(res.status, 200)
      return res.json().then(x => assert.deepEqual(x, {
        appName: "Xhip",
        say: 'hi'
      }))
    })
  })
})
