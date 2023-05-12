/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import Auth from './auth'
import Status from './status'
import Middle from './middle'
import Model from './model'
import Service, { Method } from './service'
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
      ignProps: ['ptype', 'models'],
      cpyMapper: {
        envVars: Variable.copy,
        services: Service.copy,
        auth: Auth.copy,
        middle: Middle.copy,
        frontend: Frontend.copy,
        status: Status.copy
      }
    })
    const mdlMthd: { [model: string]: Method[] } = {}
    for (const service of tgt.services) {
      if (service.model) {
        if (mdlMthd[service.model]) {
          mdlMthd[service.model].push(service.method)
        } else {
          mdlMthd[service.model] = [service.method]
        }
      }
    }
    console.log(JSON.stringify(mdlMthd))
    tgt.models.splice(
      0,
      tgt.models.length,
      ...(src.models || []).map((mdl: any) => Model.copy({ ...mdl, methods: mdlMthd[mdl.name] || [] }))
    )
    tgt.ptype = src.database && src.database.length ? 'backend' : 'frontend'
    return tgt
  }
}
