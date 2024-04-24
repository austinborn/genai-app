import { DataLinkedList } from "./dataLinkedList"

type RateLimitConfig = {
  window: number // ms
  limit: number
}

class WindowRateLimit {
  window: number // ms
  limit: number
  requests: DataLinkedList<number>


  constructor(config: RateLimitConfig) {
    this.window = config.window
    this.limit = config.limit
    this.requests = new DataLinkedList()
  }

  msUntilNextAllow(time: number) {
    const windowCutoff = time - this.window

    let head = this.requests.getHead()

    while (head && head.data < windowCutoff) {
      this.requests.remove(head.id)
      head = this.requests.getHead()
    }

    return head && this.getRequestsLength() >= this.limit
      ? head.data - windowCutoff
      : 0
  }

  addRequest(id: string, time: number) {
    this.requests.append(id, time) // TODO turn into DB ops
  }

  getRequestsLength() {
    return this.requests.getLength()
  }
}

export class RateLimiter {
  windows: WindowRateLimit[]

  constructor(configs: RateLimitConfig[]) {
    this.windows = configs.map(c => new WindowRateLimit(c))
  }

  msUntilNextAllow() {
    const time = Date.now()

    return this.windows.reduce((msUntilNextAllow, w) => (
      Math.max(msUntilNextAllow, w.msUntilNextAllow(time))
    ), 0)
  }

  addRequest(id: string, time: number) {
    for (const window of this.windows) {
      window.addRequest(id, time)
    }
  }
}
