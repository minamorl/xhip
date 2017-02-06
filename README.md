## ![Xhip](https://cdn.rawgit.com/minamorl/xhip/master/xhip.svg)

[![CircleCI](https://circleci.com/gh/minamorl/xhip.svg?style=svg)](https://circleci.com/gh/minamorl/xhip) [![npm version](https://badge.fury.io/js/xhip.svg)](https://badge.fury.io/js/xhip)


**Xhip** is a modern, isomorphic, operation-based web API framework built top on express.

## Concept

TL;DR: See [slides](http://slides.com/minamorl/api-design-for-isomorphic-age).

Core concept is do everything with only one-single-endpoint. Benefit is doing same things with less requests. In xhip, all function will become into one-single-endpoint. They are callable from frontend and become single-endpoint API. Also, Xhip integrates heavily with WebSocket. All operation will be callable from both of normal POST request and WebSocket request.

And also, we heavily focus on integration with TypeScript.

You can see full React example in [xhip-example](https://github.com/minamorl/xhip-example).

## Install

```
npm install xhip xhip-server xhip-client
```

## Example

App(app.js):

```js
import { op, load, Application } from "xhip"
const request = load("request")

export class App extends Application {
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
  cors: {
    origin: 'http://localhost:21000', // for CORS support
    credentials: true,
  }
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

When you see those codes you will notice there is wired `load` function. This is a function for isomorphic require.
From server side, it will become normal `require` function, defined by commonjs. And from frontend, it will become useless proxy object.
So that both can require same application code.

Also, there is a decorator object, named `op`. Decorator `op` automatically generate server/client compatible function. From server side, it will become endpoint definition.
From client side, it will become to argument generator which will be posted into server.


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
