## ![Xhip](https://cdn.rawgit.com/minamorl/xhip/master/xhip.svg)

[![CircleCI](https://circleci.com/gh/minamorl/xhip.svg?style=svg)](https://circleci.com/gh/minamorl/xhip) [![npm version](https://badge.fury.io/js/xhip.svg)](https://badge.fury.io/js/xhip)


## About

**Xhip** is a modern, isomorphic, operation-based web framework built top on express. For drawing the usage of this, see the codes below.

## Example

You can see React example in [xhip-example](https://github.com/minamorl/xhip-example).

App(app.js):

```js
import { op, load } from "xhip"
const request = load("request")

export class App {
  @op showAppName() {
    return {
      appName: "xhip example"
    }
  }
  @op showAppVersion() {
    return {
      appVersion: 1
    }
  }
  @op getServerIP() {
    return new Promise((resolve, reject) =>
      request.get('https://api.ipify.org?format=json', (error, response, body) => {
        if (error) reject(error)
        resolve({ ip: JSON.parse(body).ip })
      })
    ).catch(err => {
      console.log(err)
    })
  }
  @op echo(say) {
    return { say }
  }
}
export const app = new App()
```

Server-side(server.js):

```js
import { Server } from "xhip-server"
import { app } from "./app.js"

new xhip.Server(app, {
  origin: 'http://localhost:21000', // for CORS support
  credentials: true,
}).app.listen(8080)
```

Then you can access to Xhip server via xhip-client.

Client-side(client.js):

```js
import { Client } from "xhip-client"

const client = new xhip.Client("http://localhost:8080/", { ssl: false })
client.exec([
  app.showAppName(),
  app.showAppVersion(),
  app.echo("hi"),
  app.getServerIP()
]).then(res => {
  // res will be like this:
  // {
  //  appName: "xhip example",
  //  appVersion: 1,
  //  say: hi,
  //  ip: ***.***.***.***
  // }
})
```

## How it works
All operations are transformed into one endpoint. Decorator `op` automatically
generate server/client compatible function. From client side, it will become to
argument generator which will be posted into server.


## Server Specification

### Normal POST Connection

Xhip do everything in POST method.

You can inquiry this way:
```
{
  "__xhip": true,
  "operations": {
    "your_operation": argument
  }
}
```
then server must return this way:
```
{
  "your_operation": result  
}
```

Those argument and result can be any.


### WebSocket

Most is same but no need to append "__xhip" mark.


## Limitation
- Any operation must returns JSON object which can be combined with other operations.
- Not as usual importation, we have to use `Xhip.load` for support isomorphism inside app.
