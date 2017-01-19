import { op, broadcast, request } from "../src/index"

export class TestBaseApp {
  @op showAppName() {
    return {
      "appName": "Xhip"
    }
  }
  @op echo(say: any) {
    return {say}
  }
  @broadcast
  @op cast() {
    return {}
  }
}
export const app = new TestBaseApp()
