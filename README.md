# Xhip

[![CircleCI](https://circleci.com/gh/minamorl/xhip.svg?style=svg)](https://circleci.com/gh/minamorl/xhip) [![npm version](https://badge.fury.io/js/xhip.svg)](https://badge.fury.io/js/xhip)


## About

**Xhip** is a modern, isomorphic, operation-based web framework built top on express. For drawing the usage of this, see the codes below.

## Example

You can see React example in [xhip-examples](https://github.com/xhip-examples).

App(app.js):

```js
import { op } from "xhip"

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
  app.echo("hi")
]).then(res => {
  // res will be like this:
  // {
  //  appName: "xhip example",
  //  appVersion: 1,
  //  say: hi,
  // }
})
```

## How it works
All operations are transformed into one endpoint. Decorator `op` automatically
generate server/client compatible function. From client side, it will become to
argument generator which will be posted into server.


## Limitation
Any operation must returns JSON object which can be combined with other operations.
