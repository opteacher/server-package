import Column from '../types/column'
import Mapper from '../types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { reqAll, reqPost, reqPut, reqDelete } from '@/utils'
import Database from '../types/database'

export const api = {
  add: (data: any) => reqPost('database', data),
  remove: (key: any) => reqDelete('database', key),
  update: (data: any) => reqPut('database', data.key, data),
  all: (offset: number, limit: number) => reqAll('database', { query: { offset, limit }, copy: Database.copy }),
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
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
    type: 'EditList'
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
          if (port == NaN) {
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

export const emitter = new Emitter()
