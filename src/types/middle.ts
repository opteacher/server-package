import { gnlCpy } from '@/utils'
import MidDsb from './midDsb'
import MidLgn from './midLgn'
import MidNav from './midNav'

export default class Middle {
  key: string
  title: string
  prefix: string
  lclDep: boolean
  devMode: boolean
  loading: boolean
  url: string
  login: MidLgn
  navigate: MidNav
  dashboard: MidDsb

  constructor() {
    this.key = ''
    this.title = ''
    this.prefix = ''
    this.lclDep = true
    this.devMode = false
    this.loading = false
    this.url = ''
    this.login = new MidLgn()
    this.navigate = new MidNav()
    this.dashboard = new MidDsb()
  }

  reset() {
    this.key = ''
    this.title = ''
    this.prefix = ''
    this.lclDep = true
    this.devMode = false
    this.loading = false
    this.url = ''
    this.login = new MidLgn()
    this.navigate = new MidNav()
    this.dashboard = new MidDsb()
  }

  static copy(src: any, tgt?: Middle, force = false): Middle {
    return gnlCpy(Middle, src, tgt, {
      force,
      cpyMapper: { login: MidLgn.copy, navigate: MidNav.copy, dashboard: MidDsb.copy }
    })
  }
}
