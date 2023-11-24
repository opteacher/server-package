import { db } from '../utils/index.js'

export default db.defineModel(
  'database',
  {
    name: db.PropTypes.String,
    dbtype: db.PropTypes.String, // mysql | mongo
    host: db.PropTypes.String,
    port: db.PropTypes.Number,
    db: db.PropTypes.String,
    username: db.PropTypes.String,
    password: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'PUT', 'GET']
    }
  }
)
