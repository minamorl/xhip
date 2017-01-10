import { op } from "../src/index"

export class TestBaseApp {
  @op showAppName() {
    return {
      "appName": "Xhip"
    }
  }
  @op echo(say: any) {
    return {say}
  }
}
export const app = new TestBaseApp()
