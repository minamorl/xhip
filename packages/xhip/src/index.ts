import * as root from "window-or-global"
import * as express from "express"
export interface OperationFunctionResult {
  context: string
  operation: string,
  args: any[]
}
export class OperationFunction extends Function {
  constructor(
    public operation: (...args: any[]) => Promise<any> | any,
    public key: string,
    public application?: any,
  ) {
    super()
    const context = application ? application.constructor.name : "undefined"
    let fn = function(...argv: any[]): OperationFunctionResult {
      const result = {
        context,
        operation: key,
        args: argv,
      }
      return result
    }
    Object.setPrototypeOf(fn, this)
    return fn as any as OperationFunction
  }
}
export interface OperationFunction {
  (...args: any[]): OperationFunctionResult
}
export function broadcast(target: any, propertyKey?: string, descriptor?: PropertyDescriptor) {
  if (!descriptor || !descriptor.value || !propertyKey)
    throw new TypeError("broadcast decorator should apply to method")
  descriptor.value[Symbol.for("broadcast")] = true
  return descriptor
}

export function op<T>(target: any, propertyKey?: string, descriptor?: TypedPropertyDescriptor<() => Promise<T>>) {
  if (!descriptor || !descriptor.value || !propertyKey)
    throw new TypeError("op decorator should apply to method")
  descriptor.value = new OperationFunction(descriptor.value, propertyKey, target) as any
  // Add static function accessing across client side
  return descriptor
}

export class Application {
  req: express.Request
}

export function mock() {
  let x: any =  new Proxy((() => {
    return function() {
      Object.setPrototypeOf(x, {
        valueOf: () => 1
      })
      return x
    }
  })(), {
    get: (target: any, name: any) => {
      return (function() {
        if (name === Symbol.toPrimitive)
          return () => 1
        return x
      })()
    },
    set: () => x
  })
  Object.setPrototypeOf(x, {
    valueOf: function () { return 1 }
  })
  return x
}

export function load<T>(moduleName: string, load=true): T {
  const loader = root[Symbol.for("loader")]
  if (load && loader === undefined && global && module && typeof module["require"] === "function")
    return module["require"](moduleName)
  else if (load && loader) {
    return loader(moduleName)
  } else {
    return mock() as any as T
  }
}
