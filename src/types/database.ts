/* eslint-disable @typescript-eslint/no-explicit-any */

import { gnlCpy } from "@/utils"

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class DataBase {
  key: string
  name: string
  dbtype: string
  db: string
  host: string
  port: number
  username: string
  password: string

  constructor() {
    this.key = ''
    this.name = ''
    this.dbtype = ''
    this.db = ''
    this.host = ''
    this.port = -1
    this.username = ''
    this.password = ''
  }

  reset() {
    this.key = ''
    this.name = ''
    this.dbtype = ''
    this.db = ''
    this.host = ''
    this.port = -1
    this.username = ''
    this.password = ''
  }

  static copy(src: any, tgt?: DataBase, force = false): DataBase {
    return gnlCpy(DataBase, src, tgt, { force })
  }
}
