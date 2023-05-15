import { gnlCpy } from '@/utils'

export class Page {
  path: string
  layout: Array<FrtLyt>

  constructor() {
    this.path = ''
    this.layout = []
  }

  static copy(src: any, tgt?: Page, force = false) {
    return gnlCpy(Page, src, tgt, { force })
  }
}

export type FrtLyt = 'header' | 'lSider' | 'content' | 'rSider' | 'footer'

export default class Frontend {
  backend: string
  pages: Array<Page>

  constructor() {
    this.backend = ''
    this.pages = []
  }

  reset() {
    this.backend = ''
    this.pages = []
  }

  static copy(src: any, tgt?: Frontend, force = false): Frontend {
    return gnlCpy(Frontend, src, tgt, { force, cpyMapper: { pages: Page.copy } })
  }
}
