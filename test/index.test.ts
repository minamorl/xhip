import { op } from "../src/index"
import { assert } from "chai"

// Check if op decorator is broken
class TestBaseApp {
  @op showAppName() {
    return {
      "appName": "Xhip"
    }
  }
  @op echo(say: any) {
    return {say}
  }
}
const testBaseApp = new TestBaseApp()
