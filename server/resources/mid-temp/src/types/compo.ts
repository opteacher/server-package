/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export default class Compo {
  name: string
  cover: string

  constructor() {
    this.name = ''
    this.cover = ''
  }

  static copy(src: any, tgt?: Compo): Compo {
    tgt = tgt || new Compo()
    tgt.name = src.name || tgt.name
    tgt.cover = src.cover || tgt.cover
    return tgt
  }
}
