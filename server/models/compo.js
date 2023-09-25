import { db } from '../utils/index.js'

export default db.defineModel(
  'component',
  {
    name: db.PropTypes.String,
    ctype: db.PropTypes.String, // String-input/Number-Number/String-Select/Array-Cascader/String-Textarea/Boolean|Array-Checkbox/Boolean-Switch/String-Radio/Array-List/String-Color/String-Icon
    category: db.PropTypes.String, // field/display/container
    props: [
      {
        label: db.PropTypes.String,
        desc: db.PropTypes.String,
        ftype: db.PropTypes.String, // 参考CompoType
        rules: db.PropTypes.Array,
        refer: db.PropTypes.String, // 关联字段或字段的再处理，当然也可以为空（为单字段时，该组件与字段双向绑定）
        placeholder: db.PropTypes.String,
        extra: db.PropTypes.Object
      }
    ],
    inner: db.PropTypes.String,
    components: [{ type: db.PropTypes.Id, ref: 'component' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'PUT']
    }
  }
)
