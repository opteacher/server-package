import { authValues, Column, Mapper, routeMethods } from '@/common'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export const RoleColumns = [new Column('角色名', 'name')]

export const RoleMapper = new Mapper({
  name: {
    type: 'Input'
  },
  props: {
    expanded: true
  }
})

export const roleEmitter = new Emitter()

export const AuthColumns = [
  new Column('访问方式', 'method'),
  new Column('路径', 'path'),
  new Column('匹配', 'value'),
  new Column('动作', 'action')
]

export const AuthMapper = new Mapper({
  method: {
    type: 'Select',
    options: routeMethods.map((mthd: string) => ({ label: mthd, value: mthd }))
  },
  path: {
    type: 'Input'
  },
  value: {
    type: 'Select',
    options: authValues.map((val: string) => ({ label: val, value: val }))
  },
  action: {
    type: 'Input'
  }
})

export const authEmitter = new Emitter()
