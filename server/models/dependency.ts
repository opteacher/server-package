import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'dependency',
    name: db.PropTypes.String, // 只有WebModule是特殊的，它不会添加任何模组
    exports: db.PropTypes.Array,
    from: db.PropTypes.String, // import * from '出现在这里'
    default: db.PropTypes.Boolean // [true]: import exports[0] from ''; [false]: import { ..exports } from ''
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'PUT', 'ALL', 'GET']
    }
  }
)
