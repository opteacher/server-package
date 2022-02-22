import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'column',
    title: db.PropTypes.String,
    dataIndex: db.PropTypes.String,
    width: db.PropTypes.Number,
    align: db.PropTypes.String // left | right | center
  },
  {
    router: {
      methods: ['POST', 'ALL', 'GET', 'PUT', 'DELETE']
    }
  }
)
