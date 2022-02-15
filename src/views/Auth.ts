/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { API, authValues, Column, Mapper, methods, Model, Service } from '@/common'
import store from '@/store'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { v4 as uuidv4 } from 'uuid'
import { reactive } from 'vue'

export const roleColumns = [new Column('角色名', 'name')]

export const roleMapper = new Mapper({
  name: {
    type: 'Input'
  },
  props: {
    expanded: true
  }
})

export const roleEmitter = new Emitter()

export const ruleColumns = [
  new Column('访问方式', 'method'),
  new Column('路径', 'path'),
  new Column('匹配', 'value'),
  new Column('动作', 'action')
]

export const ruleMapper = new Mapper({
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

export const apiColumn = [
  new Column('所属模型', 'model'),
  new Column('访问方式', 'method'),
  new Column('路由', 'path'),
  new Column('可访问角色', 'roles'),
  new Column('签发配置', 'sign')
]

export const apiMapper = new Mapper({
  model: {},
  method: {
    type: 'Select',
    options: methods.map((mthd: string) => ({ label: mthd, value: mthd }))
  },
  path: {
    type: 'Input',
    onChange: (record: any, value: string) => {
      if (value && value[0] !== '/') {
        record['path'] = `/${value}`
      }
    }
  },
  roles: {},
  sign: {}
})

export const apiEmitter = new Emitter()

export const ruleEmitter = new Emitter()

export type CfgSgnType = { key: string; name: string; algorithm: string }
export class ConfigSign {
  show: boolean
  static emitter = new Emitter()
  static mapper = new Mapper({
    mode: {
      label: '模式',
      type: 'Select',
      options: [
        { label: '字段验证', value: 'simple' },
        { label: '流程设计', value: 'complex' }
      ]
    },
    cmpProps: {
      label: '校验字段',
      type: 'Table',
      show: false,
      emitter: new Emitter(),
      columns: [new Column('字段名', 'name'), new Column('加密算法', 'algorithm')],
      mapper: new Mapper({
        name: {
          label: '字段名',
          type: 'Select',
          options: [],
          onDropdown: async (open: boolean) => {
            if (open) {
              const model = Model.copy(
                store.getters['project/ins'].models.find(
                  (mdl: Model) => mdl.key === store.getters['auth/ins'].model
                )
              )
              ConfigSign.mapper['cmpProps'].mapper['name'].options = model.props
                .filter(prop => prop.name !== 'role')
                .map(prop => ({
                  label: prop.name,
                  value: prop.name
                }))
              ConfigSign.mapper['cmpProps'].emitter.emit(
                'update:mapper',
                ConfigSign.mapper['cmpProps'].mapper
              )
            }
          }
        },
        algorithm: {
          label: '加密算法',
          type: 'Select',
          options: ['不加密', 'md5', 'sha1', 'sha256', 'hmac', 'base64'].map(itm => ({
            label: itm,
            value: itm
          }))
        }
      }),
      copy: (src: any, tgt?: CfgSgnType) => {
        tgt = tgt || { key: uuidv4(), name: '', algorithm: '不加密' }
        tgt.key = src.key || tgt.key
        tgt.name = src.name || tgt.name
        tgt.algorithm = src.algorithm || tgt.algorithm
        return tgt
      },
      onSaved: (cmpProp: any, next: () => void) => {
        configSign.cmpProps.push(ConfigSign.mapper['cmpProps'].copy(cmpProp))
        ConfigSign.emitter.emit('update:data', configSign)
        next()
      },
      onDeleted: (key: any, next: () => void) => {
        const index = configSign.cmpProps.findIndex(cmpProp => cmpProp.key == key)
        if (index !== -1) {
          configSign.cmpProps.splice(index, 1)
        }
        ConfigSign.emitter.emit('update:data', configSign)
        next()
      }
    }
  })

  mode: 'simple' | 'complex'
  cmpProps: CfgSgnType[]

  constructor() {
    this.show = false
    this.mode = 'simple'
    this.cmpProps = []
  }

  static copy(src: any, tgt?: ConfigSign): ConfigSign {
    tgt = tgt || new ConfigSign()
    tgt.mode = src.mode || tgt.mode
    tgt.cmpProps = src.cmpProps || tgt.cmpProps
    return tgt
  }

  static async onSave(formState: ConfigSign, next: () => void) {
    console.log(ConfigSign.copy(formState))
    store.dispatch('auth/genSmplSignLgc', { props: formState.cmpProps })
    next()
  }
}

export const configSign = reactive(new ConfigSign())

export function chkIsAuthAPI(svc: Service, model?: Model): boolean {
  return (model ? model.key === store.getters['project/ins'].model : true) && svc.name === 'auth'
}

export function chkIsAuthSignAPI(api: API, svc: Service) {
  return chkIsAuthAPI(svc) && api.path.slice(-'sign'.length) === 'sign'
}

export function chkIsAuthVerifyAPI(api: API, svc: Service) {
  return chkIsAuthAPI(svc) && api.path.slice(-'verify'.length) === 'verify'
}
