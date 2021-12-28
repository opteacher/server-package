import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'database',
  name: db.PropTypes.String,
  dbs: db.PropTypes.Array,
  host: db.PropTypes.String,
  port: db.PropTypes.Number,
  username: db.PropTypes.String,
  password: db.PropTypes.String,
}, {
  router: {
    methods: ['POST', 'DELETE', 'PUT', 'ALL', 'GET']
  }
})
