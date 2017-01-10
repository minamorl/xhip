import { app } from "./app"
import { op, OperationFunction } from "../src/index"
import { assert } from "chai"

describe('op', () => {
  it('should replace original function', () => {
    assert.equal(app.echo instanceof OperationFunction, true)
  })
})
