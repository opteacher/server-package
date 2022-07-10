import { db } from '../utils/index.js'

export default db.defineModel(
  'admin',
  {
    name: db.PropTypes.String,
    phone: db.PropTypes.String,
    password: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'PUT']
    }
  }
)
