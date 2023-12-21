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
        dftVal: db.PropTypes.Any,
        index: db.PropTypes.Boolean // 是否从构造作为参数导入
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
            dftVal: db.PropTypes.Any
          }
        ],
        isAsync: db.PropTypes.Boolean,
        remark: db.PropTypes.String,
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
