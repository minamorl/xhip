import { op, broadcast, Application } from "../src/index"

export class User extends Application {
  @op async getId() {
    return { id: 1 }
  }
}

export class Post extends Application {
  @op async getId() {
    return { id: 1 }
  }
}

export class TestBaseApp extends Application {
  user = new User()
  post = new Post()
  @broadcast
  @op async getId() {
    return {}
  }
}
export const app = new TestBaseApp()
