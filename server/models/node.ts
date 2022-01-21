import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: 'node',
  title: db.PropTypes.String,
  type: db.PropTypes.String,
  inputs: [{ type: db.PropTypes.Id, ref: 'variable' }],
  outputs: [{ type: db.PropTypes.Id, ref: 'variable' }],
  code: db.PropTypes.String,
  previous: { type: db.PropTypes.Id, ref: 'node' },
  nexts: [{ type: db.PropTypes.Id, ref: 'node' }],
  relative: db.PropTypes.String
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
  }
})
