import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'form',
    width: db.PropTypes.Number,
    labelWidth: db.PropTypes.Number,
    fields: [{ type: db.PropTypes.Id, ref: 'field' }]
  },
  {
    router: {
      methods: ['POST', 'ALL', 'GET', 'PUT', 'DELETE']
    }
  }
)
