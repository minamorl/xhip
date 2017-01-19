import * as root from "window-or-global"
import { app } from "./app"
import { op, OperationFunction, load, mock } from "../src/index"
import { assert } from "chai"
// import type definition only
import * as _chai from "chai"
describe('op', () => {
  it('should replace original function', () => {
    assert.equal(app.echo instanceof OperationFunction, true)
    assert.equal(app.showAppName instanceof OperationFunction, true)
  })
})
describe('OperationFunction', () => {
  it('stores original function as property', () => {
    const original = function(arg: any) { return 1 }
    const operation = new OperationFunction(original, "key")
    assert.equal(operation.operation(null), original(null))
    root[Symbol.for("loader")] = undefined
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
describe('load', () => {
  it('should be strongly typed as original', () => {
    root[Symbol.for("loader")]
    const chai = load<typeof _chai>("chai")
    chai.assert.equal
  })
  it('should return mock if second argument is false', () => {
    const sample = load<any>("sample", false)
    assert.isFunction(
      sample.sample.sample.sample.sample.sample.sample.sample
    )
  })
  it('should be require actual module from', () => {
    assert.throws(() => load<any>("sample"))
  })
  it('should be work as integer', () => {
    const sample = load<any>("sample", false)
    assert.doesNotThrow(() => sample.x + 1)
  })
  it('should be work as string', () => {
    const sample = load<any>("sample", false)
    assert.doesNotThrow(() => sample.x + "a")
  })
})
describe('mock', () => {
  const sample = mock()
  it('should be get anything in property', () => {
    assert.isFunction(
      sample.sample.sample.sample.sample.sample.sample.sample
    )
  })
  it('should be set anything in property', () => {
    sample.sample.sample.sample.sample.sample.sample.sample = "a"
  })
  it('should be callable in property', () => {
    assert.isFunction(
      sample.sample.sample.sample.sample.sample.sample.sample("test")
    )
  })
})
describe('broadcast', () => {
  it('should append @@broadcast property', () => {
    assert.isTrue(app.cast[Symbol.for('broadcast')])
  })
})