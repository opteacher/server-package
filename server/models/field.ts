import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'field',
    index: db.PropTypes.Number,
    model: db.PropTypes.String, // 用于计算index
    label: db.PropTypes.String,
    desc: db.PropTypes.String,
    type: db.PropTypes.String, // 参考CompoType
    rules: db.PropTypes.Array
  },
  {
    router: {
      methods: ['POST', 'ALL', 'GET', 'PUT', 'DELETE']
    }
  }
)
