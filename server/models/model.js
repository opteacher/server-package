import { db } from '../utils/index.js'

export default db.defineModel(
  'model',
  {
    name: db.PropTypes.String,
    label: db.PropTypes.String,
    icon: db.PropTypes.String,
    disp: db.PropTypes.Boolean, // 是否在导航栏显示
    desc: db.PropTypes.String,
    logTime: db.PropTypes.Boolean,
    props: [
      {
        name: db.PropTypes.String,
        label: db.PropTypes.String,
        ptype: db.PropTypes.String,
        index: db.PropTypes.Boolean,
        unique: db.PropTypes.Boolean,
        visible: db.PropTypes.Boolean,
        relative: {
          model: db.PropTypes.String,
          belong: db.PropTypes.Boolean,
          isArray: db.PropTypes.Boolean
        },
        remark: db.PropTypes.String,
        dftVal: db.PropTypes.Any
      }
    ],
    form: {
      title: db.PropTypes.String,
      width: db.PropTypes.Number,
      labelWidth: db.PropTypes.Number,
      labelAlign: db.PropTypes.String, // left | right
      fields: [
        {
          label: db.PropTypes.String,
          desc: db.PropTypes.String,
          ftype: db.PropTypes.String, // 参考CompoType
          vtype: db.PropTypes.String, // 参考BaseTypes
          rules: db.PropTypes.Array,
          refer: db.PropTypes.String, // 关联字段或字段的再处理，当然也可以为空（为单字段时，该组件与字段双向绑定）
          placeholder: db.PropTypes.String,
          disabled: db.PropTypes.String, // return开头的为函数；方括号开头的为数组；其他则为字符串true或false
          display: db.PropTypes.String,
          empty: db.PropTypes.Boolean,
          extra: db.PropTypes.Object
        }
      ]
    },
    table: {
      title: db.PropTypes.String,
      desc: db.PropTypes.String,
      operaStyle: db.PropTypes.String,
      size: db.PropTypes.String,
      hasPages: db.PropTypes.Boolean,
      maxPerPgs: db.PropTypes.Number,
      refresh: db.PropTypes.Array, // [manual, auto]
      demoData: db.PropTypes.Any,
      operable: db.PropTypes.Array, // 可增加, 可编辑, 可删除
      expandURL: db.PropTypes.String, // 可扩展内容的页面URL
      expHeight: db.PropTypes.Number, // 可扩展内容的高度
      colDspable: db.PropTypes.Boolean, // 列是否可显示
      imExport: db.PropTypes.Array, // [import, export]
      columns: [
        {
          title: db.PropTypes.String,
          dataIndex: db.PropTypes.String,
          group: db.PropTypes.Array,
          width: db.PropTypes.Number,
          align: db.PropTypes.String, // left | right | center
          sortable: db.PropTypes.Boolean,
          defaultSort: db.PropTypes.String, // | ascend | descend
          searchable: db.PropTypes.Boolean,
          filterable: db.PropTypes.Boolean,
          notDisplay: db.PropTypes.Boolean
        }
      ],
      cells: [
        {
          refer: db.PropTypes.String,
          cdCell: db.PropTypes.Object, // [condition]: { color, prefix, suffix }
          color: db.PropTypes.String,
          prefix: db.PropTypes.String,
          suffix: db.PropTypes.String,
          ctype: db.PropTypes.String,
          format: db.PropTypes.Object
        }
      ]
    }
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'LINK', 'PUT']
    }
  }
)
