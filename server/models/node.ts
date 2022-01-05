import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'node',
  type: db.PropTypes.String,
  inputs: db.PropTypes.Object,
  outputs: db.PropTypes.Array,
  code: db.PropTypes.String,
  previous: { type: db.PropTypes.Id, ref: 'node' },
  nexts: [{ type: db.PropTypes.Id, ref: 'node' }],
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK']
  }
})
