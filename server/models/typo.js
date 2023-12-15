import { db } from '../utils/index.js'

export default db.defineModel(
  'typo',
  {
    name: db.PropTypes.String,
    label: db.PropTypes.String,
    desc: db.PropTypes.String,
    props: [
      {
        name: db.PropTypes.String,
        label: db.PropTypes.String,
        ptype: db.PropTypes.String,
        remark: db.PropTypes.String,
        default: db.PropTypes.Any
      }
    ],
    funcs: [
      {
        name: db.PropTypes.String,
        args: [
          {
            name: db.PropTypes.String,
            label: db.PropTypes.String,
            ptype: db.PropTypes.String,
            remark: db.PropTypes.String,
            default: db.PropTypes.Any
          }
        ],
        flow: { type: db.PropTypes.Id, ref: 'node' }
      }
    ]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'LINK', 'PUT']
    }
  }
)
