/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { URL } from 'url'
export default class Deploy {
  key: string
  gitURL: string
  name: string
  buildCmd: string
  // * 生成目录，【所在目录】：~/dist/apps/${project.name}/tmp/*
  indexPath: string
  assetsPath: string
  // * 部署目录，【所在目录】：~/app/(assetsPath: public/${project.name}/*|indexPath: views/index.html)
  //    > 位于容器中，由docker container cp复制过去

  constructor() {
    this.key = ''
    this.gitURL = ''
    this.name = ''
    this.buildCmd = 'npm run build'
    this.indexPath = 'public'
    this.assetsPath = 'public/static'
  }

  reset() {
    this.key = ''
    this.gitURL = ''
    this.name = ''
    this.buildCmd = 'npm run build'
    this.indexPath = 'public/index.html'
    this.assetsPath = 'public/static'
  }

  static copy(src: any, tgt?: Deploy): Deploy {
    tgt = tgt || new Deploy()
    tgt.key = src.key || src._id || tgt.key
    tgt.gitURL = src.gitURL || tgt.gitURL
    if (tgt.gitURL) {
      const url = new URL(tgt.gitURL)
      const nameSfx = url.pathname.split('/').pop()
      tgt.name = nameSfx?.substring(0, nameSfx.lastIndexOf('.')) as string
    }
    tgt.buildCmd = src.buildCmd || tgt.buildCmd
    tgt.indexPath = src.indexPath || tgt.indexPath
    tgt.assetsPath = src.assetsPath || tgt.assetsPath
    return tgt
  }
}
