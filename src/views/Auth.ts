/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { API, authValues, Column, Mapper, routeMethods } from '@/common'
import store from '@/store'
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
  method: {},
  path: {},
  value: {
    type: 'Select',
    options: authValues.map((val: string) => ({ label: val, value: val }))
  },
  action: {
    type: 'Input'
  }
})

export const ApiColumn = [
  new Column('所属模型', 'model'),
  new Column('访问方式', 'method'),
  new Column('路由', 'path'),
  new Column('可访问角色', 'roles')
]

export const ApiMapper = new Mapper({
  model: {},
  method: {
    type: 'Select',
    options: routeMethods.map((mthd: string) => ({ label: mthd, value: mthd }))
  },
  path: {
    type: 'Input',
    prefix: `/${store.getters['project/ins'].name}`,
    onChange: (record: any, value: string) => {
      if (value && value[0] !== '/') {
        record['path'] = `/${value}`
      }
    }
  },
  roles: {}
})

export function copyApi(src: any, tgt?: API): API {
  tgt = { model: '自定义', method: 'GET', path: '/', roles: [] }
  tgt.model = src.model || tgt.model
  tgt.method = src.method || tgt.method
  tgt.path = src.path || tgt.path
  tgt.roles = src.roles || tgt.roles
  return tgt
}

export const apiEmitter = new Emitter()

export const authEmitter = new Emitter()

export const DataSetMapper = new Mapper({
  props: {
    empty: true
  }
})
