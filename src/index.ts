import * as express from "express"
import * as bodyParser from "body-parser"
import * as http from "http"
import "isomorphic-fetch"

type OperationFunctions = {[key: string]: OperationFunction}
const operationFunctionSymbol = Symbol('OperationFunction')
class OperationFunction extends Function {
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

export class AppBase {
  constructor() {
    this[operationFunctionSymbol] = {} as OperationFunctions
  }
}

export class Server {
  app: express.Application
  constructor(appBase: any) {
    const app = express()
    app.use(bodyParser.json());
    const availableOperations = Object.getPrototypeOf(appBase)[operationFunctionSymbol] as OperationFunctions
    const keys: Array<string> = Object.keys(availableOperations).map(
      x => availableOperations[x].key)

    app.post('/', (req, res) => {
      if (req.body['__xhip']) {
        let result = {}
        if (!req.body['operations']) {
          return res.sendStatus(200)
        }
        for (const key of Object.getOwnPropertyNames(
          req.body['operations']
        )) {
          if (keys.indexOf(key) !== -1) {
            result = Object.assign(result,
              Object.getPrototypeOf(appBase)[operationFunctionSymbol][key].operation(
                req.body['operations'][key]
              )
            )
          }
        }
        res.json(result)
      } else {
        return res.sendStatus(400)
      }
    })
    this.app = app
  }
}

export class Client {
  uri: string
  constructor(private server: http.Server, private opts: { ssl: boolean }) {
    let { address } = server.address()
    if (address === "::") {
      address = "127.0.0.1"
    }
    this.uri = "http" + (opts.ssl ? "s" : "") + "://"
      + address + ":"
      + server.address().port + "/"
  }
  exec = (ops: Array<any>) => {
    const body = JSON.stringify({
      '__xhip': true,
      'operations': Object.assign({}, ...ops)
    })
    return fetch(this.uri, {
      headers: {
        'Content-Type': 'application/json'
      },
      method: 'POST',
      body
    }).then(res => {
      if (res.status >= 400) return Promise.reject(res)
      return res.json()
    })
  }
}
