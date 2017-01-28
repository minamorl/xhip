import * as express from "express"
import * as bodyParser from "body-parser"
import * as http from "http"
import * as cors from "cors"
import * as ws from "ws"

import {OperationFunction} from "xhip"

export interface ServerOptions {
  cors?: cors.CorsOptions
  server?: http.Server
}
export class Server {
  app: express.Application
  server: http.Server
  constructor(public appBase: any, public options?: ServerOptions) {
    const app = express()
    app.use(cors(options!.cors!))
    app.use(bodyParser.json({limit: '50mb'}));

    app.post('/', async (req, res) => {
      if (req.body['__xhip']) {
        if (!req.body['operations']) {
          return res.sendStatus(200)
        }
        const result = await this.getOperationResult(req.body['operations'], req)
        res.json(result)
      } else {
        return res.sendStatus(400)
      }
    })
    this.app = app
  }
  get appBaseProto() {
    return Object.getPrototypeOf(this.appBase)
  }
  lookupOperationFunction(context: string, operation: string, currentBase=this.appBase): OperationFunction | null {
    const currentBaseProto = Object.getPrototypeOf(currentBase)
    if(currentBaseProto.constructor.name === context)
      return currentBaseProto[operation]
    const names = Object.getOwnPropertyNames(currentBase)
    if (names.length === 1 && names.indexOf('constructor') !== -1)
      return null
    const protoName = names.filter(x => 
      Object.getPrototypeOf(currentBase[x]).constructor && Object.getPrototypeOf(currentBase[x]).constructor.name === context)[0]
    if (protoName)
      return this.lookupOperationFunction(context, operation, currentBase[protoName])
    return names.map(name => this.lookupOperationFunction(context, operation, currentBase[name]))[0] || null
  }
  async getOperationResult(operations: any[], req: express.Request) {
    let result = {}
    for (let op of operations) {
      const {operation} = op
      const {args} = op
      const {context} = op
      const operationFunction = this.lookupOperationFunction(context, operation)
     if (!operationFunction) return
      const operated = await operationFunction.operation.apply({req}, args)
      result = Object.assign(result,
        {
          [operation]: {
            ...operated,
            [Symbol.for("broadcast")]: operationFunction[Symbol.for("broadcast")]
          }
        }
      )
    }
    return result
  }
  listen(...args: any[]): http.Server {
    this.server = http.createServer(this.app)
    const expressWs = require('express-ws')(this.app, this.server)
    const broadcast = (message: string): void => {
      expressWs.getWss().clients.forEach((client: any) => {
        try {
          client.send(message)
        } catch(e) {
          // nothing to do
        }
      })
    }
    this.app['ws']('/ws', (ws: ws, req: express.Request) => {
      ws.on('message', message => {
        this.getOperationResult(JSON.parse(message)['operations'], req)
          .then((result: {}) => {
            return Object.keys(result).forEach(key => 
              result[key][Symbol.for("broadcast")] ? broadcast(JSON.stringify(result)) : ws.send(JSON.stringify(result)))
          }).catch()
      })
    })
    return (this.server.listen as any)(...args) as http.Server
  }
}
