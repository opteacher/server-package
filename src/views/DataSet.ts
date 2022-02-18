/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import Model from '@/types/model'

export class DtStTable {
  columns: Column[]
  mapper: Mapper

  constructor() {
    this.columns = []
    this.mapper = new Mapper()
  }

  setModel(model: Model) {
    this.columns = model.props.map(prop => new Column(prop.label, prop.name))
    this.mapper = new Mapper(
      Object.fromEntries(model.props.map(prop => [prop.name, { type: 'Unknown' }]))
    )
  }
}
