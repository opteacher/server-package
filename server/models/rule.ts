import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'rule',
    method: db.PropTypes.String,
    path: db.PropTypes.String,
    value: db.PropTypes.String, // * | s | key
    action: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
