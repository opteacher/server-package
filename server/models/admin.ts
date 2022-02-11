import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'admin',
    name: db.PropTypes.String,
    phone: db.PropTypes.String,
    password: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
