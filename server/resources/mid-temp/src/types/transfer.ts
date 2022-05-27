export default class Transfer {
  file: string[] // 上传文件在服务器的临时位置
  dest: string // 文件投放到docker容器的位置（基于/app）
  project?: string // 项目名，也是docker容器名

  constructor() {
    this.file = []
    this.dest = ''
  }

  reset() {
    this.file = []
    this.dest = ''
  }

  static copy(src: any, tgt?: Transfer): Transfer {
    tgt = tgt || new Transfer()
    tgt.file = src.file || tgt.file
    tgt.dest = src.dest || tgt.dest
    tgt.project = src.project || tgt.project
    return tgt
  }
}
