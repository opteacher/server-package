import { db } from '../utils/index.js'

export default db.defineModel(
  'node',
  {
    isTemp: db.PropTypes.Boolean,
    group: db.PropTypes.String,
    title: db.PropTypes.String,
    desc: db.PropTypes.String,
    ntype: db.PropTypes.String,
    inputs: [
      {
        name: db.PropTypes.String,
        vtype: db.PropTypes.String,
        value: db.PropTypes.Any,
        prop: db.PropTypes.String,
        index: db.PropTypes.String,
        idxType: db.PropTypes.String,
        default: db.PropTypes.Any,
        required: db.PropTypes.Boolean,
        remark: db.PropTypes.String
      }
    ],
    outputs: [
      {
        name: db.PropTypes.String,
        vtype: db.PropTypes.String,
        value: db.PropTypes.Any,
        prop: db.PropTypes.String,
        index: db.PropTypes.String,
        idxType: db.PropTypes.String,
        default: db.PropTypes.Any,
        required: db.PropTypes.Boolean,
        remark: db.PropTypes.String
      }
    ],
    isFun: db.PropTypes.Boolean,
    code: db.PropTypes.String,
    previous: { type: db.PropTypes.Id, ref: 'node' },
    nexts: [{ type: db.PropTypes.Id, ref: 'node' }],
    relative: db.PropTypes.String,
    deps: [{ type: db.PropTypes.Id, ref: 'dependency' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'PUT', 'LINK']
    }
  }
)
