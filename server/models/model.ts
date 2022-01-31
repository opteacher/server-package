import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'model',
  name: db.PropTypes.String,
  desc: db.PropTypes.String,
  logTime: db.PropTypes.Boolean,
  props: [{ type: db.PropTypes.Id, ref: 'property' }],
  apis: [{ type: db.PropTypes.Id, ref: 'service' }],
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
  }
})
