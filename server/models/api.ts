import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'api',
    method: db.PropTypes.String,
    path: db.PropTypes.String,
    desc: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
