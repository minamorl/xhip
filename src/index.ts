import * as root from "window-or-global"
export type OperationFunctions = {[key: string]: OperationFunction}
export const operationFunctionSymbol = Symbol.for('OperationFunction')
export class OperationFunction extends Function {
  constructor(
    public operation: (args: any) => any,
    public key: string
  ) {
    super()
    this.operation = (args: any) => {
      if (typeof require === "function")
        root[Symbol.for("loader")] = require
      return operation(args)
    }
    let fn = function(arg?: any) {
      let result = {}
      result[key] = arg ? arg : null
      return result
    }
    Object.setPrototypeOf(fn, this)
    return fn as any as OperationFunction
  }
}

export const op = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  // Update descriptor with wrapper class
  if (!target[operationFunctionSymbol])
    target[operationFunctionSymbol] = {}
  descriptor.value = target[operationFunctionSymbol][propertyKey] = new OperationFunction(descriptor.value, propertyKey)
  // Add static function accessing across client side
  return descriptor
}

export function load<T>(moduleName: string): T {
  const loader = root[Symbol.for("loader")]
  if (loader)
    return loader(moduleName)
  let x: any = new Proxy(function() { return x }, {get: () => x, set: () => x})
  return x as any as T
}
