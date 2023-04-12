import { gnlCpy } from '@/utils'

export const lytMapper = {
  none: '空布局'
}

export type Layout = keyof typeof lytMapper

export const lytOpns = Object.entries(lytMapper).map(([value, label]) => ({ label, value }))

export class Page {
  path: string
  layout: Layout

  constructor() {
    this.path = ''
    this.layout = 'none'
  }

  static copy(src: any, tgt?: Page, force = false) {
    return gnlCpy(Page, src, tgt, { force })
  }
}

export class Export {
  name: string
  pages: Page[]
  withLib: boolean
  modules: string[]

  constructor() {
    this.name = ''
    this.pages = []
    this.withLib = true
    this.modules = []
  }

  static copy(src: any, tgt?: Export, force = false): Export {
    return gnlCpy(Export, src, tgt, {
      force,
      cpyMapper: { pages: Page.copy }
    })
  }
}

export type FrtLyt = 'header' | 'lSider' | 'content' | 'rSider' | 'footer'

export default class Frontend {
  backend: string
  layout: Array<FrtLyt>

  constructor() {
    this.backend = ''
    this.layout = []
  }

  reset() {
    this.backend = ''
    this.layout = []
  }

  static copy(src: any, tgt?: Frontend, force = false): Frontend {
    return gnlCpy(Frontend, src, tgt, { force })
  }
}
