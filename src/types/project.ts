/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Auth from './auth'
import Status from './status'
import Middle from './middle'
import Model from './model'
import Service from './service'
import Frontend from './frontend'
import Variable from './variable'
import { gnlCpy } from '@/utils'

export default class Project {
  key: string
  ptype: 'frontend' | 'backend'
  name: string
  desc: string
  port: number
  thread: number
  database: string[]
  dropDbs: boolean
  commands: string
  independ: boolean
  envVars: Variable[]
  expPorts: number[]
  volumes: any[]
  models: Model[]
  services: Service[]
  auth: Auth
  middle: Middle
  frontend: Frontend
  status: Status

  constructor() {
    this.key = ''
    this.ptype = 'backend'
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
    this.volumes = []
    this.models = []
    this.services = []
    this.auth = new Auth()
    this.middle = new Middle()
    this.frontend = new Frontend()
    this.status = new Status()
  }

  reset() {
    this.key = ''
    this.ptype = 'backend'
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
    this.volumes = []
    this.models = []
    this.services = []
    this.auth = new Auth()
    this.middle = new Middle()
    this.frontend = new Frontend()
    this.status = new Status()
  }

  static copy(src: any, tgt?: Project, force = false): Project {
    tgt = gnlCpy(Project, src, tgt, {
      force,
      ignProps: ['ptype'],
      cpyMapper: {
        envVars: Variable.copy,
        models: Model.copy,
        services: Service.copy,
        auth: Auth.copy,
        middle: Middle.copy,
        frontend: Frontend.copy,
        status: Status.copy
      }
    })
    tgt.ptype = src.database && src.database.length ? 'backend' : 'frontend'
    return tgt
  }
}
