import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'role',
    name: db.PropTypes.String,
    auths: [{ type: db.PropTypes.Id, ref: 'authorization' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
