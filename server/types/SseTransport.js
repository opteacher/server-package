import Transport from 'winston-transport'
import { PassThrough } from 'stream'

export default class SseTransport extends Transport {
  static #instance = new SseTransport()
  #stream = new PassThrough()

  constructor(opts) {
    super(opts)
  }

  log (info, callback) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    if (this.#stream) {
      this.#stream.write('event: message\n')
      this.#stream.write(`data: ${info.message}\n\n`)
    }

    callback()
  }

  static thisOne() {
    return SseTransport.#instance
  }

  get stream() {
    return this.#stream
  }

  close () {
    if (this.#stream) {
      this.#stream.write('event: stop\n')
      this.#stream.write('data: \n\n')
    }
  }

}