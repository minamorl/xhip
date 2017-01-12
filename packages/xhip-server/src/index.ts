import * as express from "express"
import * as bodyParser from "body-parser"
import * as http from "http"
import * as cors from "cors"
import {OperationFunctions, operationFunctionSymbol} from "xhip"

export class Server {
  app: express.Application
  constructor(appBase: any, corsOptions: cors.CorsOptions) {
    const app = express()
    app.use(cors(corsOptions))
    app.use(bodyParser.json());
    const availableOperations = Object.getPrototypeOf(appBase)[operationFunctionSymbol] as OperationFunctions
    const keys: Array<string> = Object.keys(availableOperations).map(
      x => availableOperations[x].key)

    app.post('/', async (req, res) => {
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
              await Object.getPrototypeOf(appBase)[operationFunctionSymbol][key].operation(
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
