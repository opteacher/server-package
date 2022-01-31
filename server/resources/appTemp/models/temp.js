import { db } from '../utils/index.js'

export default db.defineModel({
  __modelName: ''/*return `\'${model.name}\'`*/,
  /*return model.props.map((prop) => `${prop.name}: db.PropTypes.${prop.type}`).join(',\n  ')*/
}, {
  router: {
    methods: ['ALL', /*return model.apis.map((api) => `\'${api.method}\'`).join(', ')*/]
  }
})
