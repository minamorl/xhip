import { op, broadcast, Application } from "../src/index"

export class TestBaseApp extends Application {
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
