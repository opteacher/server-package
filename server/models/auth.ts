import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'auth',
    model: db.PropTypes.String,
    skips: db.PropTypes.Array,
    props: db.PropTypes.Array,
    roles: [{ type: db.PropTypes.Id, ref: 'role' }],
    apis: [{ type: db.PropTypes.Id, ref: 'api' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
