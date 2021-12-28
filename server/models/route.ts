import { getDatabase } from '../utils/index.js'

const db = await getDatabase()

export default db.defineModel({
  __modelName: 'route',
  method: db.PropTypes.String,
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
  }
})
