import { Column, Mapper, Model } from "@/common"

export class DtStTable {
  columns: Column[]
  mapper: Mapper

  constructor () {
    this.columns = []
    this.mapper = new Mapper({})
  }

  setModel (model: Model) {
    this.columns = model.props.map(prop => new Column(prop.label, prop.name))
    this.mapper = new Mapper(Object.fromEntries(
      model.props.map(prop => [prop.name, { type: 'Unknown' }])
    ))
  }
}
