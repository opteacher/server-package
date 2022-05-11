import { db } from '../utils/index.js'

export default db.defineModel(
  'project',
  {
    name: db.PropTypes.String,
    desc: db.PropTypes.String,
    port: db.PropTypes.Number,
    thread: db.PropTypes.Number,
    database: db.PropTypes.Array, // [0]: 数据库类型; [1]: 数据库名
    dropDbs: db.PropTypes.Boolean, // 是否在同步时清空数据库
    commands: db.PropTypes.String,
    models: [{ type: db.PropTypes.Id, ref: 'model' }],
    auth: {
      model: db.PropTypes.String,
      skips: db.PropTypes.Array,
      props: db.PropTypes.Array,
      roles: [
        {
          name: db.PropTypes.String,
          rules: [
            {
              method: db.PropTypes.String,
              path: db.PropTypes.String,
              value: db.PropTypes.String, // * | s | key
              action: db.PropTypes.String
            }
          ]
        }
      ],
      apis: [
        {
          method: db.PropTypes.String,
          path: db.PropTypes.String,
          desc: db.PropTypes.String
        }
      ]
    }
  },
  {
    router: {
      methods: ['POST', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
