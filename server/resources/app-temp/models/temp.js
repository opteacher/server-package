import { db } from '../utils/index.js'

export default db.defineModel(''/*return `\'${model.name}\'`*/,
  {
    /*return model.props.map((prop) => !prop.index && !prop.unique ? `${prop.name}: db.PropTypes.${prop.ptype}` : `${prop.name}: { type: db.PropTypes.${prop.ptype}${prop.index ? ', index: true' : ''}${prop.unique ? ', unique: true' : ''} }`).join(',\n    ')*/
  },
  {
    router: {
      methods: ['ALL', /*return model.svcs.map((svc) => `\'${svc.method}\'`).join(', ')*/]
    }
  }
)
