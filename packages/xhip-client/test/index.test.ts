import * as express from "express"
import * as http from "http"
import { op, Server } from "xhip"
import { Client } from "../src/index"
import "isomorphic-fetch"
import { assert } from "chai"
// Check if op decorator is broken
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
describe('Client', () => {
  let app: express.Application
  let server: http.Server
  beforeEach((done) => {
    app = new Server(testBaseApp).app
    server = http.createServer(app)
    server.listen(0, done)
  })
  afterEach((done) => {
    server.close(done)
  })
  it('can execute from client', () => {
    const client = new Client("http://"
      + "127.0.0.1:"
      + server.address().port, { ssl: false })
    return client.exec([testBaseApp.showAppName(), testBaseApp.echo("hi")]).then(res => {
      assert.deepEqual(res, {say: "hi"})
    })
  })
})
