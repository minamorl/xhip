import { Client } from "../src/index"
import * as sinon from "sinon"
import { assert } from "chai"
import * as fetchMock from "fetch-mock"
import {Application, op} from "xhip"

fetchMock.post("*", JSON.stringify(
  {
    a: "b"
  }
))

global["URL"] = sinon.mock()
global["WebSocket"] = sinon.mock()

class Test extends Application {
  @op async a() {
    return {a: "b"}
  }
}

console.log(fetch)

describe('Client', () => {
  describe('exec', () => {
    it('should creatable from test', async () => {
      const client = new Client("http://www.example.com/", { ssl: false })
      const app = new Test()
      const result = await client.exec(app.a())
      assert.deepEqual(result, {
        a: "b"
      })
    })
  })
})
