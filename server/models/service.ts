import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'service',
  name: db.PropTypes.String,
  model: db.PropTypes.String,
  interface: db.PropTypes.String,
  deps: [{ type: db.PropTypes.Id, ref: 'dependency' }],
  emit: db.PropTypes.String, // API / TIME / INTERVAL / NONE
  flow: { type: db.PropTypes.Id, ref: 'node' },
  isModel: db.PropTypes.Boolean,
  method: db.PropTypes.String,
  path: db.PropTypes.String,
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
  }
})
