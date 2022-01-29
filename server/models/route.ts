import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'route',
  isModel: db.PropTypes.Boolean,
  method: db.PropTypes.String,
  path: db.PropTypes.String,
  flow: { type: db.PropTypes.Id, ref: 'node' },
  service: db.PropTypes.String,
  interface: db.PropTypes.String,
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
  }
})
