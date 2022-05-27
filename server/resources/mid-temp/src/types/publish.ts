export default class Publish {


  static copy(src: any, tgt?: Publish): Publish {
    tgt = tgt || new Publish()
    return tgt
  }
}
