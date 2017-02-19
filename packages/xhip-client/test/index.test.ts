import { Client } from "../src/index"
import * as sinon from "sinon"
import { assert } from "chai"
import * as fetchMock from "fetch-mock"
import {Application, op} from "xhip"

global["URL"] = sinon.mock()
global["WebSocket"] = sinon.mock()

class Test extends Application {
  @op async a() {
    return {a: "b"}
  }
}

describe('Client', () => {
  describe('exec', () => {
    describe('when succeeds', () => {
      it('should yield result', async () => {
        fetchMock.postOnce("*", JSON.stringify({
          result: {
            a: "b"
          }
        }))
        const client = new Client("http://www.example.com/", { ssl: false })
        const app = new Test()
        const result = await client.exec(app.a())
        assert.deepEqual(result, {
          a: "b"
        })
      })
    })
    describe('when fails', () => {
      it('should throw error', async () => {
        fetchMock.postOnce("*", JSON.stringify({
          error: {
            name: "Error",
            message: "error!"
          }
        }))
        const client = new Client("http://www.example.com/", { ssl: false })
        const app = new Test()
        let error: any
        try {
          await client.exec(app.a())
        } catch (e) {
          error = e
        }
        assert.deepEqual(error, {
          name: "Error",
          message: "error!"
        })
      })
    })
  })
})
