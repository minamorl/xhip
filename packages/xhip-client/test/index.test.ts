import { Client } from "../src/index"
import * as sinon from "sinon"
import { assert } from "chai"
import * as fetchMock from "fetch-mock"

fetchMock.post("*", JSON.stringify(
  [{
    b: "a"
  }]
))

global["URL"] = sinon.mock()
global["WebSocket"] = sinon.mock()

console.log(fetch)

describe('Client', () => {
  describe('exec', () => {
    it('should creatable from test', async () => {
        const client = new Client("http://www.example.com/", { ssl: false })
        const result = await client.exec([{ a: "a" }])
        assert.deepEqual(result, {
        b: "a"
        })
    })
  })
})
