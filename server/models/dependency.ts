import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'dependency',
  name: db.PropTypes.String,
  exports: db.PropTypes.Array,
}, {
  router: {
    methods: ['POST', 'DELETE', 'PUT', 'ALL', 'GET']
  }
})
