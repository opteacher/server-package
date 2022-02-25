import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'table',
    title: db.PropTypes.String,
    desc: db.PropTypes.String,
    operaStyle: db.PropTypes.String,
    size: db.PropTypes.String,
    hasPages: db.PropTypes.Boolean,
    demoData: db.PropTypes.Any,
    columns: [{ type: db.PropTypes.Id, ref: 'column' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
    }
  }
)
