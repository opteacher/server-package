import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'field',
    label: db.PropTypes.String,
    desc: db.PropTypes.String,
    type: db.PropTypes.String, // 参考CompoType
    rules: db.PropTypes.Array,
    refer: db.PropTypes.String // 关联字段或字段的再处理，当然也可以为空（为单字段时，该组件与字段双向绑定）
  },
  {
    router: {
      methods: ['POST', 'ALL', 'GET', 'PUT', 'DELETE']
    }
  }
)
