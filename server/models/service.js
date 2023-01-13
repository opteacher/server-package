import { db } from '../utils/index.js'

export default db.defineModel(
  'service',
  {
    name: db.PropTypes.String,
    interface: db.PropTypes.String,
    // api / timeout / interval / app_start / app_end / none
    emit: db.PropTypes.String,
    flow: { type: db.PropTypes.Id, ref: 'node' },
    isModel: db.PropTypes.Boolean,
    method: db.PropTypes.String,
    path: db.PropTypes.String,
    jobId: db.PropTypes.Number,
    // 以Y/M/D/h/m/s/ms结尾，则表示时间段，
    // 对于time，则在此时间段后激发；对于interval，则每过此时间段就执行一次。
    // 除此以外，如果是--/--/00T00:00:00格式存储，则在该时间执行，激发方式随意
    condition: db.PropTypes.String,
    needRet: db.PropTypes.Boolean,
    desc: db.PropTypes.LongStr
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'LINK', 'PUT']
    }
  }
)
