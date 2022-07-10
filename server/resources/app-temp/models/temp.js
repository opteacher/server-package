import { db } from '../utils/index.js'

export default db.defineModel(''/*return `\'${model.name}\'`*/,
  {
    /*return model.props.map((prop) => !prop.index && !prop.unique && !prop.relative.model ? `${prop.name}: db.PropTypes.${prop.ptype}` : `${prop.name}: ${prop.relative.isArray ? '[' : ''}{ type: db.PropTypes.${prop.ptype}${prop.index ? ', index: true' : ''}${prop.unique ? ', unique: true' : ''}${prop.relative.model ? ', ref: \'' + prop.relative.model + '\', belong: ' + (prop.relative.belong ? 'true' : 'false') : ''} }${prop.relative.isArray ? ']' : ''}`).join(',\n    ')*/
  },
  {
    router: {
      methods: [/*return model.svcs.map((svc) => svc.method === 'GET' && svc.path.slice(-2) === '\s' ? '\'ALL\'' : `\'${svc.method}\'`).join(', ')*/]
    }
  }
)
