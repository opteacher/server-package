import { baseTypes, Column, Mapper, Model, Property, Route, routeMethods } from '@/common'

export class ModelTable {
  columns: Column[]
  mapper: Mapper
  current: Model
  expandeds: string[]

  constructor() {
    this.columns = [
      new Column('模型名', 'name'),
      new Column('是否记录新增时间和更新时间', 'logTime')
    ]
    this.mapper = new Mapper({
      name: {
        label: '模型名',
        type: 'Input',
        rules: [{ required: true, message: '请输入模型名！', trigger: 'blur' }]
      },
      logTime: {
        label: '是否记录新增时间和更新时间',
        type: 'Switch'
      },
      props: {
        expanded: true
      }
    })
    this.current = new Model()
    this.expandeds = []
  }
}

export class PropTable {
  columns: Column[]
  mapper: Mapper
  current: Property

  constructor() {
    this.columns = [
      new Column('字段名', 'name'),
      new Column('字段类型', 'type'),
      new Column('是否为索引', 'index'),
      new Column('是否唯一', 'unique'),
      new Column('是否可访问', 'visible')
    ]
    this.mapper = new Mapper({
      name: {
        label: '字段名',
        type: 'Input',
        rules: [{ required: true, message: '请输入字段名！', trigger: 'blur' }]
      },
      type: {
        label: '字段类型',
        type: 'Select',
        options: baseTypes,
        rules: [{ type: 'array', required: true, message: '请选择字段类型！', trigger: 'change' }]
      },
      index: {
        label: '是否为索引',
        type: 'Switch'
      },
      unique: {
        label: '是否唯一',
        type: 'Switch'
      },
      visible: {
        label: '是否可访问',
        type: 'Switch'
      }
    })
    this.current = new Property()
  }
}

export class RouteTable {
  columns: Column[]
  mapper: Mapper
  current: Route

  constructor() {
    this.columns = [
      new Column('访问方式', 'method'),
      new Column('路径', 'path'),
      new Column('编辑', 'flow')
    ]
    this.mapper = new Mapper({
      method: {
        label: '访问方式',
        type: 'Select',
        options: routeMethods
      },
      path: {},
      flow: {}
    })
    this.current = new Route()
  }
}
