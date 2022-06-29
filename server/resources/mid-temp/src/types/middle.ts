import MidLgn from './midLgn'
import MidNav from './midNav'

export default class Middle {
  key: string
  title: string
  prefix: string
  lclDep: boolean
  loading: boolean
  url: string
  login: MidLgn
  navigate: MidNav

  constructor() {
    this.key = ''
    this.title = ''
    this.prefix = ''
    this.lclDep = true
    this.loading = false
    this.url = ''
    this.login = new MidLgn()
    this.navigate = new MidNav()
  }

  reset() {
    this.key = ''
    this.title = ''
    this.prefix = ''
    this.lclDep = true
    this.loading = false
    this.url = ''
    this.login = new MidLgn()
    this.navigate = new MidNav()
  }

  static copy(src: any, tgt?: Middle): Middle {
    tgt = tgt || new Middle()
    tgt.title = src.title || tgt.title
    tgt.prefix = src.prefix || tgt.prefix
    tgt.lclDep = typeof src.lclDep !== 'undefined' ? src.lclDep : tgt.lclDep
    tgt.loading = typeof src.loading !== 'undefined' ? src.loading : tgt.loading
    tgt.url = src.url || tgt.url
    tgt.login = src.login ? MidLgn.copy(src.login) : tgt.login
    tgt.navigate = src.navigate ? MidNav.copy(src.navigate) : tgt.navigate
    return tgt
  }
}
