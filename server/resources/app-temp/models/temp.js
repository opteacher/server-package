import { db } from '../utils/index.js'

export default db.defineModel(''/*return `\'${model.name}\'`*/,
  {
    /*return model.props.map((prop) => `${prop.name}: db.PropTypes.${prop.ptype}`).join(',\n    ')*/
  },
  {
    router: {
      methods: ['ALL', /*return model.svcs.map((svc) => `\'${svc.method}\'`).join(', ')*/]
    }
  }
)
