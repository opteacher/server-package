import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'route',
  method: db.PropTypes.String,
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
  }
})
