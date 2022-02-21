import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'form',
    labelWidth: db.PropTypes.Number,
    fields: [{ type: db.PropTypes.Id, ref: 'field' }]
  },
  {
    router: {
      methods: ['POST', 'ALL', 'GET', 'PUT', 'DELETE']
    }
  }
)
