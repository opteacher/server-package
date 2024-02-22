import { db } from '../utils/index.js'

export default db.defineModel(
  'typo',
  {
    name: db.PropTypes.String,
    label: db.PropTypes.String,
    desc: db.PropTypes.String,
    super: { type: db.PropTypes.Id, ref: 'dependency' },
    // 父类的构造函数参数，只在指定了super的时候有效
    // 优先于props参数：constructor(...params, ...props)
    params: db.PropTypes.Array,
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
    funcs: [{ type: db.PropTypes.Id, ref: 'func' }]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'LINK', 'PUT']
    }
  }
)
