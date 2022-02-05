import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'deploy',
    gitURL: db.PropTypes.String,
    buildCmd: db.PropTypes.String,
    indexPath: db.PropTypes.String,
    assetsPath: db.PropTypes.String
  },
  {
    router: {
      methods: ['POST', 'ALL', 'GET', 'PUT', 'DELETE']
    }
  }
)
