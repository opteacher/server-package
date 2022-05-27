import MidLgn from "./midLgn";
import MidNav from "./midNav";

export default class Middle {
  key: string
  login: MidLgn
  navigate: MidNav

  constructor() {
    this.key = ''
    this.login = new MidLgn()
    this.navigate = new MidNav()
  }

  reset() {
    this.key = ''
    this.login = new MidLgn()
    this.navigate = new MidNav()
  }

  static copy(src: any, tgt?: Middle): Middle {
    tgt = tgt || new Middle()
    tgt.login = src.login ? MidLgn.copy(src.login) : tgt.login
    tgt.navigate = src.navigate ? MidNav.copy(src.navigate) : tgt.navigate
    return tgt
  }
}
