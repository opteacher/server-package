import { db } from '../utils/index.js'

export default db.defineModel(
  'component',
  {
    name: db.PropTypes.String,
    cover: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'PUT']
    }
  }
)
