export default class Health {
  status: 'loading' | 'running' | 'stopped'
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
    this.status = 'stopped'
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
    this.status = 'stopped'
    this.name = ''
    this.pid = 0
    this.memory.raw = ''
    this.memory.percent = ''
    this.cpu = ''
    this.io.net = ''
    this.io.block = ''
  }

  static copy(src: any, tgt?: Health): Health {
    tgt = tgt || new Health()
    tgt.status = src.status || tgt.status
    tgt.name = src.name || tgt.name
    tgt.pid = src.pid || tgt.pid
    if (src.memory) {
      tgt.memory.raw = src.memory.raw || tgt.memory.raw
      tgt.memory.percent = src.memory.percent || tgt.memory.percent
    }
    tgt.cpu = src.cpu || tgt.cpu
    if (src.io) {
      tgt.io.net = src.io.net || tgt.io.net
      tgt.io.block =  src.io.block || tgt.io.block
    }
    return tgt
  }
}
