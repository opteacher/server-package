import { db } from '../utils/index.js'

export default db.defineModel(
  'component',
  {
    name: db.PropTypes.String,
    ctype: db.PropTypes.String, // 绑定类型：String-input/Number-Number/String-Select/Array-Cascader/String-Textarea/Boolean|Array-Checkbox/Boolean-Switch/String-Radio/Array-List/String-Color/String-Icon
    category: db.PropTypes.String, // 组件分类：field/display/container
    inner: db.PropTypes.String,
    props: [ // 组件实例的字段Mapper
      {
        label: db.PropTypes.String,
        desc: db.PropTypes.String,
        ftype: db.PropTypes.String, // 参考CompoType
        vtype: db.PropTypes.String,
        dftVal: db.PropTypes.Any,
        rules: db.PropTypes.Array,
        refer: db.PropTypes.String, // 关联字段或字段的再处理，当然也可以为空（为单字段时，该组件与字段双向绑定）
        placeholder: db.PropTypes.String,
        vModel: db.PropTypes.Boolean,
        disabled: db.PropTypes.Boolean,
        extra: db.PropTypes.Object
      }
    ],
    components: [{ type: db.PropTypes.Id, ref: 'component' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'PUT']
    }
  }
)
