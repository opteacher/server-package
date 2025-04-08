import { db } from '../utils/index.js'

export default db.defineModel(
  'service',
  {
    name: db.PropTypes.String,
    interface: db.PropTypes.String,
    // api / timeout / interval / app_start / app_end / none
    emit: db.PropTypes.String,
    deps: [{ type: db.PropTypes.Id, ref: 'dependency' }],
    flow: { type: db.PropTypes.Id, ref: 'node' },
    model: { type: db.PropTypes.Id, ref: 'model' },
    method: db.PropTypes.String,
    path: db.PropTypes.String,
    jobId: db.PropTypes.String,
    // 当emit为interval，则condition为cron格式。
    // 当emit为timeout，则condition为datetime格式（--/--/00T00:00:00）
    condition: db.PropTypes.String,
    needRet: db.PropTypes.Boolean,
    desc: db.PropTypes.LongStr,
    stcVars: [
      {
        name: db.PropTypes.String,
        vtype: db.PropTypes.String,
        value: db.PropTypes.Any,
        prop: db.PropTypes.String,
        index: db.PropTypes.String,
        idxType: db.PropTypes.String,
        dftVal: db.PropTypes.Any,
        required: db.PropTypes.Boolean,
        remark: db.PropTypes.String
      }
    ]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'LINK', 'PUT']
    }
  }
)
