import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'variable',
  name: db.PropTypes.String,
  type: db.PropTypes.String,
  value: db.PropTypes.Any,
  default: db.PropTypes.Any,
  required: db.PropTypes.Boolean
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET']
  }
})
