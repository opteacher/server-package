import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'role',
    name: db.PropTypes.String,
    rules: [{ type: db.PropTypes.Id, ref: 'rule' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
