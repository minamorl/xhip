import * as express from "express"
import * as bodyParser from "body-parser"

class OperationFunction {
  constructor(
    public operation: (args: any) => any,
    public name: string
  ) {}
}

export const op = (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
  descriptor.value = new OperationFunction(descriptor.value, propertyKey)
  return descriptor
}

const filterAllOperations = function*(instance: any) {
  for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
    if(instance[key] instanceof OperationFunction) {
      yield instance[key]
    }
  }
}
export const Server = (AppBaseClass: any) => {
  const app = express()
  const instance = new AppBaseClass()
  app.use(bodyParser.json());
  const availableOperations = Array.from(filterAllOperations(instance))
  const names: Array<string> = availableOperations.map(x => x.name)

  app.post('/', (req, res) => {
    if (req.body['__xhip']) {
      let result = {}
      if (!req.body['operations']) {
        return res.sendStatus(200)
      }
      for (const key of Object.getOwnPropertyNames(
        req.body['operations']
      )) {
        if (names.indexOf(key) !== -1) {
          result = Object.assign(result,
            instance[key].operation(
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

  return app
}
