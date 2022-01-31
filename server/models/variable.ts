import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'variable',
  name: db.PropTypes.String,
  type: db.PropTypes.String,
  value: db.PropTypes.Any,
  prop: db.PropTypes.String,
  index: db.PropTypes.String,
  idxType: db.PropTypes.String,
  default: db.PropTypes.Any,
  required: db.PropTypes.Boolean,
  remark: db.PropTypes.String,
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT']
  }
})
