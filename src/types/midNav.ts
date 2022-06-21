export default class MidNav {
  key: string
  theme: 'dark' | 'light'
  logo: string

  constructor() {
    this.key = ''
    this.theme = 'dark'
    this.logo = ''
  }

  reset() {
    this.key = ''
    this.theme = 'dark'
    this.logo = ''
  }

  static copy(src: any, tgt?: MidNav): MidNav {
    tgt = tgt || new MidNav()
    tgt.key = src.key || src._id || tgt.key
    tgt.theme = src.theme || tgt.theme
    tgt.logo = src.logo || tgt.logo
    return tgt
  }

  equals(to: any): boolean {
    return this.theme === to.theme && this.logo === to.logo
  }
}
