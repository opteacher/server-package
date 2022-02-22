import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'table',
    size: db.PropTypes.String,
    columns: [{ type: db.PropTypes.Id, ref: 'column' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
    }
  }
)
