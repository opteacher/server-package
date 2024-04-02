import Path from 'path'
import { readConfig } from '../lib/backend-library/utils/index.js'
import Transport from 'winston-transport'
import mqtt from 'mqtt'

const cfgPath = Path.resolve('configs')
const dbConfig = readConfig(Path.join(cfgPath, 'db'), true)
const config = dbConfig.mqtt

const qos = 0

export default class MqttTransport extends Transport {
  static instance = new MqttTransport()
  #client = mqtt.connect(`mqtt://${config.host}:${config.mqttPort}`, {
    clientId: config.cliPrefix + Math.random().toString(16).substring(2, 8),
    username: config.username,
    password: config.password
  })

  constructor(opt) {
    super(opt)
    this.#client.subscribe(config.topic, { qos }, err => {
      if (err) {
        console.error(err)
      }
    })
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    if (this.#client && this.#client.connected && info.message) {
      this.#client.publish(config.topic, info.message, { qos }, err => {
        if (err) {
          console.error(err)
        }
      })
    }

    callback()
  }
}
