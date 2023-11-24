import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'

export const columns = [
  new Column('名称', 'name'),
  new Column('类型', 'dbtype'),
  new Column('数据库', 'db'),
  new Column('主机地址', 'host'),
  new Column('端口', 'port')
]
export const mapper = new Mapper({
  name: {
    label: '名称',
    type: 'Input',
    rules: [{ required: true, message: '请输入数据源名称！', trigger: 'blur' }]
  },
  dbtype: {
    label: '类型',
    type: 'Select',
    options: ['mongo', 'mysql'].map(itm => ({ label: itm, value: itm })),
    rules: [{ required: true, message: '请选择数据库类型！', trigger: 'change' }]
  },
  db: {
    label: '数据库',
    type: 'Input',
    rules: [{ required: true, message: '请输入数据库名称！', trigger: 'blur' }]
  },
  host: {
    label: '主机地址',
    type: 'Input',
    rules: [{ required: true, message: '请输入主机地址！', trigger: 'blur' }]
  },
  port: {
    label: '端口',
    type: 'Number',
    rules: [
      {
        validator: (_rule: any[], value: any) => {
          const port = parseInt(value)
          if (isNaN(port)) {
            return Promise.reject('非数字!')
          } else if (port <= 1000) {
            return Promise.reject('端口不得小于等于1000！')
          } else {
            return Promise.resolve()
          }
        },
        message: '端口必须大于1000！',
        trigger: 'blur'
      }
    ]
  },
  username: {
    label: '用户名',
    type: 'Input'
  },
  password: {
    label: '密码',
    type: 'Input',
    iptType: 'password'
  }
})
