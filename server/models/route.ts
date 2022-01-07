import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'route',
  method: db.PropTypes.String,
  path: db.PropTypes.String,
  flow: { type: db.PropTypes.Id, ref: 'node' }
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
  }
})
