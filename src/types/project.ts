/* eslint-disable @typescript-eslint/no-explicit-any */

import Auth from './auth'
import Deploy from './deploy'
import Model from './model'

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Project {
  key: string
  name: string
  desc: string
  port: number
  thread: number
  database: string[]
  dropDbs: boolean
  commands: string
  frontend?: Deploy
  models: Model[]
  auth: Auth | null
  status: 'loading' | 'running' | 'stopped'

  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.port = 0
    this.thread = 0
    this.database = []
    this.dropDbs = false
    this.commands = ''
    this.models = []
    this.auth = null
    this.status = 'stopped'
  }

  reset() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.port = 0
    this.thread = 0
    this.database = []
    this.dropDbs = false
    this.commands = ''
    this.models = []
    this.auth = null
    this.status = 'stopped'
  }

  static copy(src: any, tgt?: Project): Project {
    tgt = tgt || new Project()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.desc = src.desc || tgt.desc
    tgt.port = src.port || tgt.port
    tgt.thread = src.thread || 0
    tgt.database = src.database || tgt.database
    tgt.dropDbs = src.dropDbs || tgt.dropDbs
    tgt.commands = src.commands || tgt.commands
    if (src.frontend) {
      Deploy.copy(src.frontend, tgt.frontend)
    }
    if (src.models) {
      tgt.models.splice(0, tgt.models.length)
      for (const model of src.models) {
        tgt.models.push(Model.copy(model))
      }
    }
    tgt.auth = src.auth ? Auth.copy(src.auth) : tgt.auth
    tgt.status = src.status || tgt.status
    return tgt
  }
}
