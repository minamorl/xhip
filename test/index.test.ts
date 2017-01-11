import { app } from "./app"
import { op, OperationFunction } from "../src/index"
import { assert } from "chai"

describe('op', () => {
  it('should replace original function', () => {
    assert.equal(app.echo instanceof OperationFunction, true)
    assert.equal(app.showAppName instanceof OperationFunction, true)
  })
})
describe('OperationFunction', () => {
  it('stores original function as property', () => {
    const original = function(arg: any) {}
    const operation = new OperationFunction(original, "key")
    assert.equal(operation.operation, original)
  })
  it('stores original function as property', () => {
    const original = function(arg: any) {}
    const operation = new OperationFunction(original, "key")
    assert.equal(operation.operation, original)
  })
  it('stores key as property', () => {
    const original = function(arg: any) {}
    const operation = new OperationFunction(original, "key")
    assert.equal(operation.key, "key")
  })
  it('acts as callable and return value as {[operation]: arg}', () => {
    const original = function(arg: any) {}
    const operation = new OperationFunction(original, "key")
    assert.deepEqual(operation("value"), {
      "key": "value"
    })
  })
  it('accepts empty argument and transform undefined to null when instance is called', () => {
    const original = function(arg: any) {}
    const operation = new OperationFunction(original, "key")
    assert.deepEqual(operation(), {
      "key": null
    })
  })
})
