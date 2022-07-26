import { db } from '../utils/index.js'

export default db.defineModel(
  'dependency',
  {
    name: db.PropTypes.String, // 只有WebModule是特殊的，它不会添加任何模组
    exports: db.PropTypes.Array,
    from: db.PropTypes.String, // import * from '出现在这里'
    default: db.PropTypes.Boolean, // [true]: import exports[0] from ''; [false]: import { ..exports } from ''
    version: db.PropTypes.String, // 如果定义了版本，则该依赖会出现在package.json中，包名为from
    belong: db.PropTypes.String // 项目名
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'PUT', 'GET']
    }
  }
)
