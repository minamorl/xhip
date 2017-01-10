import "whatwg-fetch"

export class Client {
  constructor(public uri: string, public opts: { ssl: boolean }) {
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
      mode: 'cors',
      credentials: 'include',
      method: 'POST',
      body
    }).then(res => {
      if (res.status >= 400) return Promise.reject(res)
      return res.json()
    })
  }
}
