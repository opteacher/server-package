import { gnlCpy } from '@/utils'

export const stats = {
  loading: '加载中',
  running: '运行中',
  stopped: '已停止'
}

export type Stat = keyof typeof stats

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

  static copy(src: any, tgt?: Status, force = false): Status {
    tgt = gnlCpy(Status, src, tgt, { force, ignProps: ['memory', 'io'] })
    if (src.memory) {
      tgt.memory.raw = src.memory.raw || tgt.memory.raw
      tgt.memory.percent = src.memory.percent || tgt.memory.percent
    }
    if (src.io) {
      tgt.io.net = src.io.net || tgt.io.net
      tgt.io.block = src.io.block || tgt.io.block
    }
    return tgt
  }
}
