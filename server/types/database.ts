/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class DataBase {
  key: string
  name: string
  dbs: string[]
  host: string
  port: number
  username: string
  password: string

  constructor() {
    this.key = ''
    this.name = ''
    this.dbs = []
    this.host = ''
    this.port = -1
    this.username = ''
    this.password = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.dbs = []
    this.host = ''
    this.port = -1
    this.username = ''
    this.password = ''
  }

  static copy(src: any, tgt?: DataBase): DataBase {
    tgt = tgt || new DataBase()
    tgt.key = src.key || src._id || tgt.key
    tgt.name = src.name || tgt.name
    tgt.dbs = src.dbs || tgt.dbs
    tgt.host = src.host || tgt.host
    tgt.port = src.port || tgt.port
    tgt.username = src.username || tgt.username
    tgt.password = src.password || tgt.password
    return tgt
  }
}
