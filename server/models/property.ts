import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'property',
  name: db.PropTypes.String,
  type: db.PropTypes.String,
  index: db.PropTypes.Boolean,
  unique: db.PropTypes.Boolean,
  visible: db.PropTypes.Boolean,
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
  }
})
