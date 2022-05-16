/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import API from '@/types/api'
import { authValues } from '@/types/rule'
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import { Cond, methods } from '@/types'
import Model from '@/types/model'
import Service from '@/types/service'
import store from '@/store'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { createVNode, ref } from 'vue'
import { Modal } from 'ant-design-vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import SgnProp from '@/types/sgnProp'
import { authAPI } from '../apis'

export async function refresh() {
  await store.dispatch('project/refresh')
  apiEmitter.emit('refresh')
  roleEmitter.emit('refresh')
  ruleEmitter.emit('refresh')
}

export const authVsb = ref(false)

export const emitter = new Emitter()

export const mapper = new Mapper({
  model: {
    label: '账户模型',
    type: 'Select',
    options: []
  },
  skips: {
    label: '跳过链接',
    type: 'EditList',
    mode: 'select',
    options: []
  },
  opera: {
    label: '操作',
    type: 'Button',
    danger: true,
    inner: '解除绑定',
    onClick: async () => {
      Modal.confirm({
        title: '确定解除绑定吗？',
        icon: createVNode(ExclamationCircleOutlined),
        content: '会删除生成的两个属于auth的服务、所有角色和规则',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          await authAPI.save({ model: '' })
          emitter.emit('update:show', false)
          await refresh()
        }
      })
    },
    display: [Cond.copy({ key: 'model', cmp: '!=', val: '' })]
  }
})

export async function onAuthShow(show: boolean) {
  if (show) {
    mapper['model'].loading = true
    emitter.emit('update:mapper', mapper)
    await store.dispatch('project/refresh')
    mapper['model'].options = store.getters['project/ins'].models.map((mdl: Model) => ({
      label: mdl.name,
      value: mdl.key
    }))
    emitter.emit('update:mapper', mapper)
    mapper['model'].loading = false
  }
  authVsb.value = show
}

export const roleColumns = [new Column('角色名', 'name')]

export const roleMapper = new Mapper({
  name: {
    label: '角色名',
    type: 'Input'
  },
  props: {
    expanded: true,
    display: false
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
  method: {
    label: '访问方式',
    type: 'Select',
    options: methods.map((method: any) => ({ label: method, value: method }))
  },
  path: {
    label: '路由',
    type: 'Cascader'
  },
  value: {
    label: '匹配方式',
    type: 'Select',
    options: authValues.map((val: string) => ({ label: val, value: val }))
  },
  action: {
    label: '动作',
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
  model: {
    label: '所属模型'
  },
  method: {
    label: '访问方式',
    type: 'Select',
    options: methods.map((mthd: string) => ({ label: mthd, value: mthd }))
  },
  path: {
    label: '路由',
    type: 'Input',
    onChange: (record: any, value: string) => {
      if (value && value[0] !== '/') {
        record['path'] = `/${value}`
      }
    }
  },
  roles: { display: false },
  sign: { display: false }
})

export const apiEmitter = new Emitter()

export const ruleEmitter = new Emitter()

export const signEmitter = new Emitter()

export const signMapper = new Mapper({
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
    columns: [new Column('字段名', 'name'), new Column('加密算法', 'alg')],
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
            signMapper['cmpProps'].mapper['name'].options = model.props
              .filter(prop => prop.name !== 'role')
              .map(prop => ({
                label: prop.name,
                value: prop.name
              }))
            signMapper['cmpProps'].emitter.emit('update:mapper', signMapper['cmpProps'].mapper)
          }
        }
      },
      alg: {
        label: '加密算法',
        type: 'Select',
        options: ['none', 'md5', 'sha1', 'sha256', 'hmac', 'base64'].map(itm => ({
          label: itm === 'none' ? '不加密' : itm,
          value: itm
        }))
      }
    }),
    copy: SgnProp.copy,
    onSaved: (cmpProp: any, next: () => void) => {
      signMapper.cmpProps.push(signMapper['cmpProps'].copy(cmpProp))
      signMapper.emitter.emit('update:data', signMapper)
      next()
    },
    onDeleted: (key: any, next: () => void) => {
      const index = signMapper.cmpProps.findIndex((cmpProp: SgnProp) => cmpProp.key == key)
      if (index !== -1) {
        signMapper.cmpProps.splice(index, 1)
      }
      signMapper.emitter.emit('update:data', signMapper)
      next()
    }
  }
})

export function chkIsAuthAPI(svc: Service, model?: Model): boolean {
  return (model ? model.key === store.getters['project/ins'].model : true) && svc.name === 'auth'
}

export function chkIsAuthSignAPI(api: API, svc: Service) {
  return chkIsAuthAPI(svc) && api.path.slice(-'sign'.length) === 'sign'
}

export function chkIsAuthVerifyAPI(api: API, svc: Service) {
  return chkIsAuthAPI(svc) && api.path.slice(-'verify'.length) === 'verify'
}
