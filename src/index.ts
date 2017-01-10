export type OperationFunctions = {[key: string]: OperationFunction}
export const operationFunctionSymbol = Symbol.for('OperationFunction')
export class OperationFunction extends Function {
  constructor(
    public operation: (args: any) => any,
    public key: string
  ) {
    super()
    return new Proxy(this, {
      apply: function (target: any, thisArg: any, argumentsList: any) {
        let result = {}
        result[key] = argumentsList[0]
        return result
      }
    })
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
