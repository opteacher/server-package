import { db } from '../utils/index.js'

export default db.defineModel(''/*return `\'${model.name}\'`*/,
  {
    /*return model.props.map((prop) => !prop.index && !prop.unique && (!prop.relative || !prop.relative.model) && typeof prop.default === 'undefined' ? `${prop.name}: db.PropTypes.${prop.ptype}` : `${prop.name}: ${prop.relative.isArray ? '[' : ''}{ type: db.PropTypes.${prop.relative.model ? 'Id' : prop.ptype}${prop.index ? ', index: true' : ''}${prop.unique ? ', unique: true' : ''}${typeof prop.default !== 'undefined' ? ', default: ' + prop.default : ''}${prop.relative && prop.relative.model ? ', ref: \'' + prop.relative.model + '\', belong: ' + (prop.relative.belong ? 'true' : 'false') : ''} }${prop.relative.isArray ? ']' : ''}`).join(',\n    ')*/
  },
  {
    router: {
      methods: [/*return model.services.map((svc) => `\'${svc.method}\'`).join(', ')*/]
    },
    timestamps: 0/*return model.logTime ? 'true' : 'false'*/
  }
)
