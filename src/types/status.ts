export type Stat = 'loading' | 'running' | 'stopped'

export default class Status {
  stat: Stat
  name: string
  pid: number
  memory: {
    raw: string
    percent: string
  }
  cpu: string
  io: {
    net: string
    block: string
  }

  constructor() {
    this.stat = 'stopped'
    this.name = ''
    this.pid = 0
    this.memory = {
      raw: '',
      percent: ''
    }
    this.cpu = ''
    this.io = {
      net: '',
      block: ''
    }
  }

  reset() {
    this.stat = 'stopped'
    this.name = ''
    this.pid = 0
    this.memory.raw = ''
    this.memory.percent = ''
    this.cpu = ''
    this.io.net = ''
    this.io.block = ''
  }

  static copy(src: any, tgt?: Status): Status {
    tgt = tgt || new Status()
    tgt.stat = src.stat || tgt.stat
    tgt.name = src.name || tgt.name
    tgt.pid = src.pid || tgt.pid
    if (src.memory) {
      tgt.memory.raw = src.memory.raw || tgt.memory.raw
      tgt.memory.percent = src.memory.percent || tgt.memory.percent
    }
    tgt.cpu = src.cpu || tgt.cpu
    if (src.io) {
      tgt.io.net = src.io.net || tgt.io.net
      tgt.io.block = src.io.block || tgt.io.block
    }
    return tgt
  }
}
