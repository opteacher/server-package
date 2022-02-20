import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'component',
    name: db.PropTypes.String,
    cover: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
