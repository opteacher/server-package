import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: ''/*return `\'${model.name}\'`*/,
  /*return model.props.map((prop) => `${prop.name}: db.PropTypes.${prop.type}`).join(',\n  ')*/
}, {
  router: {
    methods: [/*return model.routes.map((route) => `\'${route.method}\'`).join(', ')*/]
  }
})