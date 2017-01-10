# Xhip

## About

**Xhip** is a modern, isomorphic, operation-based web framework built top on express. For drawing the usage of this, see the codes:

Server-side:

```js
import { Server, op } from xhip

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
app.use(new xhip.Server(app).app)
server.serve()
```

Client-side:

```js
import { app } from "./server"

const client = new xhip.Client(app)
client.exec([
  App.showAppName(),
  App.showAppVersion(),
  App.echo("hi")
]).then(res => {
  // res will be like this:
  // {
  //  appName: "xhip example",
  //  appVersion: 1,
  //  say: hi,
  // }
})
```

All operations are transformed into one endpoint. Any operation must returns JSON object which can be combined with other operations.
