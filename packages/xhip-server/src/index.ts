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
    app.use(bodyParser.json());

    app.post('/', async (req, res) => {
      if (req.body['__xhip']) {
        if (!req.body['operations']) {
          return res.sendStatus(200)
        }
        const result = await this.getOperationResult(req.body['operations'])
        res.json(result)
      } else {
        return res.sendStatus(400)
      }
    })
    this.app = app
  }
  async getOperationResult(operations: any) {
    let result = {}
    const keys = Object.getOwnPropertyNames(Object.getPrototypeOf(this.appBase))
      .filter(v => Object.getPrototypeOf(this.appBase)[v] instanceof OperationFunction)
    for (const key of Object.getOwnPropertyNames(operations)) {
      if (keys.indexOf(key) !== -1) {
        const operated = await Object.getPrototypeOf(this.appBase)[key].operation(
          operations[key]
        )
        result = Object.assign(result,
          {
            [key]: {
              ...operated,
              [Symbol.for("broadcast")]: Object.getPrototypeOf(this.appBase)[key][Symbol.for("broadcast")]
            }
          }
        )
      }
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
        this.getOperationResult(JSON.parse(message)['operations'])
          .then((result: {}) => {
            return Object.keys(result).forEach(key => 
              result[key][Symbol.for("broadcast")] ? broadcast(JSON.stringify(result)) : ws.send(JSON.stringify(result)))
          }).catch()
      })
    })
    return (this.server.listen as any)(...args) as http.Server
  }
}
