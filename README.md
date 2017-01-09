# Xhip

## About

**Xhip** is a modern, isomorphic, operation-based web framework built top on express. For drawing the usage of this, see the codes:

Server-side:

```
import { Server, op } from xhip

export class App {
  @op showAppName: () => ({
    appName: "xhip example"
  })
  @op showAppVersion: () => ({
    appVersion: 1
  })
  @op echo: say => ({
    say
  })
}
app.use(new xhip.Server(App))
server.serve()
```

Client-side:

```
import { App } from "./server"

const client = new xhip.Client(App)
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
