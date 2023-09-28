import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'

export const columns = [
  new Column('名称', 'name'),
  new Column('数据库', 'dbs'),
  new Column('主机地址', 'host'),
  new Column('端口', 'port')
]
export const mapper = new Mapper({
  name: {
    label: '名称',
    type: 'Input',
    rules: [{ required: true, message: '请输入数据库名称！', trigger: 'blur' }]
  },
  dbs: {
    label: '数据库',
    type: 'EditList',
    mapper: new Mapper({
      value: {
        type: 'Input',
        placeholder: '输入数据库'
      }
    }),
    newFun: () => ({ value: '' })
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
