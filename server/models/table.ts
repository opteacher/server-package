import { db } from '../utils/index.js'

export default db.defineModel(
  {
    __modelName: 'table',
    title: db.PropTypes.String,
    desc: db.PropTypes.String,
    operaStyle: db.PropTypes.String,
    size: db.PropTypes.String,
    hasPages: db.PropTypes.Boolean,
    demoData: db.PropTypes.Any,
    columns: [{ type: db.PropTypes.Id, ref: 'column' }],
    cells: db.PropTypes.Any,
    operable: db.PropTypes.Array // 可增加, 可编辑, 可删除
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'ALL', 'GET', 'LINK', 'PUT']
    }
  }
)
