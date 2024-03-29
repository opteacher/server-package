import Path from 'path'
import Transport from 'winston-transport'
import { createClient } from 'redis'
import { readConfig } from '../lib/backend-library/utils/index.js'

export const cfgPath = Path.resolve('configs')
export const { redis } = readConfig(Path.join(cfgPath, 'db'), true)

export default class RedisTransport extends Transport {
  static #instance = new RedisTransport()
  #redisCli = createClient({
    password: redis.password,
    socket: {
      host: redis.host,
      port: redis.port
    }
  })

  constructor(opts) {
    super(opts)
    this.#redisCli.on('error', err => console.error(err))
  }

  async log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    if (!this.#redisCli.isReady) {
      this.#redisCli.publish(rdsCfg.topic, info.message)
    }

    callback()
  }

  static thisOne() {
    return RedisTransport.#instance
  }

  async open() {
    await this.#redisCli.connect()
    return this
  }

  async close() {
    await this.#redisCli.disconnect()
  }

}