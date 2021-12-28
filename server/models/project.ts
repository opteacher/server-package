import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'project',
  name: db.PropTypes.String,
  desc: db.PropTypes.String,
  port: db.PropTypes.Number,
  database: db.PropTypes.Array, // [0]: 数据库类型; [1]: 数据库名
  models: [{ type: db.PropTypes.Id, ref: 'model' }]
}, {
  router: {
    methods: ['POST', 'ALL', 'GET', 'PUT']
  }
})