/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Auth from './auth'
import Status from './status'
import Middle from './middle'
import Model from './model'

export default class Project {
  key: string
  name: string
  desc: string
  port: number
  thread: number
  database: string[]
  dropDbs: boolean
  commands: string
  independ: boolean
  envVars: { name: string; value: string }[]
  expPorts: number[]
  models: Model[]
  auth: Auth
  middle: Middle
  status: Status

  constructor() {
    this.key = ''
    this.name = ''
    this.desc = ''
    this.port = 0
    this.thread = 0
    this.database = []
    this.dropDbs = false
    this.commands = ''
    this.independ = false
    this.envVars = []
    this.expPorts = []
    this.models = []
    this.auth = new Auth()
    this.middle = new Middle()
    this.status = new Status()
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
    this.independ = false
    this.envVars = []
    this.expPorts = []
    this.models = []
    this.auth = new Auth()
    this.middle = new Middle()
    this.status = new Status()
  }

  static copy(src: any, tgt?: Project): Project {
    tgt = tgt || new Project()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.desc = src.desc || tgt.desc
    tgt.port = src.port || tgt.port
    tgt.thread = src.thread || 0
    tgt.database = src.database || tgt.database
    tgt.dropDbs = typeof src.dropDbs !== 'undefined' ? src.dropDbs : tgt.dropDbs
    tgt.commands = src.commands || tgt.commands
    tgt.independ = typeof src.independ !== 'undefined' ? src.independ : tgt.independ
    tgt.envVars = src.envVars
      ? src.envVars.map((evar: any) => ({
          key: evar.key || evar._id || undefined,
          name: evar.name,
          value: evar.value
        }))
      : tgt.envVars
    tgt.expPorts = src.expPorts || tgt.expPorts
    if (src.models) {
      tgt.models.splice(0, tgt.models.length)
      for (const model of src.models) {
        tgt.models.push(Model.copy(model))
      }
    }
    tgt.auth = src.auth ? Auth.copy(src.auth) : tgt.auth
    tgt.middle = src.middle ? Middle.copy(src.middle) : tgt.middle
    tgt.status = src.status ? Status.copy(src.status) : tgt.status
    return tgt
  }
}
