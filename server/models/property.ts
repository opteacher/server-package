import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'property',
    name: db.PropTypes.String,
    label: db.PropTypes.String,
    type: db.PropTypes.String,
    index: db.PropTypes.Boolean,
    unique: db.PropTypes.Boolean,
    visible: db.PropTypes.Boolean,
    remark: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
