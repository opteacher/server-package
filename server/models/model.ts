import { getDatabase } from '../utils/index.js'

const db = await getDatabase()

export default db.defineModel({
  __modelName: 'model',
  name: db.PropTypes.String,
  logTime: db.PropTypes.Boolean,
  props: [{ type: db.PropTypes.Id, ref: 'property' }],
  routes: [{ type: db.PropTypes.Id, ref: 'route' }],
}, {
  router: {
    methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK']
  }
})
