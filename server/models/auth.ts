import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'auth',
    model: { type: db.PropTypes.Id, ref: 'model' },
    idProps: db.PropTypes.Array,
    pwdProp: db.PropTypes.String,
    roles: [{ type: db.PropTypes.Id, ref: 'role' }],
    apis: [{ type: db.PropTypes.Id, ref: 'api' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
