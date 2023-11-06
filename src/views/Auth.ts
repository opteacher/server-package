/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import store from '@/store'
import { Cond, methods } from '@/types'
import API from '@/types/api'
import Model from '@/types/model'
import Project from '@/types/project'
import Rule from '@/types/rule'
import { authValues } from '@/types/rule'
import Service from '@/types/service'
import SgnProp from '@/types/sgnProp'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import Column from '@lib/types/column'
import Mapper from '@lib/types/mapper'
import { Modal } from 'ant-design-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { createVNode, ref } from 'vue'

import { authAPI, mdlAPI } from '../apis'

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
    rules: [{ required: true, message: '必须选择账户模型' }],
    options: []
  },
  skips: {
    label: '跳过链接',
    type: 'EditList',
    flatItem: true,
    mapper: {
      item: {
        type: 'Select',
        placeholder: '选择要跳过的链接',
        options: []
      }
    },
    emitter: new Emitter(),
    newFun: () => ({ item: '' })
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
          await authAPI.unbind()
          emitter.emit('update:show', false)
          await refresh()
        }
      })
    },
    display: [new Cond({ key: 'model', cmp: '!=', val: '' })]
  }
})

export async function onAuthShow(show: boolean) {
  if (show) {
    await store.dispatch('project/refresh')
    emitter.emit('update:mprop', {
      'model.loading': true,
      'model.options': store.getters['project/ins'].models.map((mdl: Model) => ({
        label: mdl.name,
        value: mdl.key
      })),
      'skips.mapper.item.options': store.getters['project/apis'].map((svc: any) => ({
        label: svc.path,
        value: svc.path
      }))
    })
    emitter.emit('update:data', store.getters['project/ins'].auth)
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
    display: false
  }
})

export const roleEmitter = new Emitter()

export const ruleColumns = [
  new Column('访问方式', 'method'),
  new Column('路径', 'path'),
  new Column('匹配', 'value'),
  new Column('指定项', 'idens'),
  new Column('动作', 'action')
]

export const ruleMapper = new Mapper({
  method: {
    label: '访问方式',
    type: 'Select',
    options: methods.concat('ALL').map((method: any) => ({ label: method, value: method }))
  },
  path: {
    label: '路由',
    type: 'Cascader'
  },
  value: {
    label: '匹配方式',
    type: 'Radio',
    style: 'button',
    options: Object.entries(authValues).map(([val, dsc]) => ({
      label: val,
      subLabel: dsc,
      value: val
    })),
    onChange: (rule: Rule) => {
      if (rule.value === ':i') {
        pickPKeyFmPath(rule)
      }
    }
  },
  idens: {
    label: '指定项',
    desc: '需要启动项目，才能在此检索到模型数据ID',
    type: 'EditList',
    display: [new Cond({ key: 'value', cmp: '=', val: ':i' })],
    inline: false,
    mapper: {
      model: {
        label: '模型',
        type: 'Select',
        rules: [{ required: true, message: '必须指定模型！' }],
        onChange: async ({ model }: any) => {
          const project = store.getters['project/ins'] as Project
          if (project.status.stat !== 'running') {
            return
          }
          console.log(await mdlAPI.dataset(model))
        }
      },
      pKey: {
        label: '路由中的标识',
        type: 'Select',
        rules: [{ required: true, message: '必须选择路由中的标识！' }],
        placeholder: '需先填写完整路由'
      },
      pVal: {
        label: '指定数据ID',
        type: 'Select',
        rules: [{ required: true, message: '必须选择数据ID！' }],
        placeholder: '需先启动项目'
      }
    },
    newFun: () => ({ model: '', pKey: '', pVal: '' })
  },
  action: {
    label: '动作',
    type: 'Input'
  }
})

export function pickPKeyFmPath(editing: Rule) {
  const params: string[] = []
  for (let idx = editing.path.indexOf('/:'); idx != -1; idx = editing.path.indexOf('/:', idx + 2)) {
    const nxtIdx = editing.path.indexOf('/', idx + 2)
    params.push(editing.path.slice(idx + 2, nxtIdx === -1 ? undefined : nxtIdx))
  }
  ruleEmitter.emit('update:mprop', {
    'idens.mapper.pKey.options': params.map(param => ({
      label: param,
      value: param
    }))
  })
}

export const apiColumn = [
  new Column('所属模型', 'model', { filterable: true }),
  new Column('访问方式', 'method', { filterable: true }),
  new Column('路由', 'path'),
  new Column('可访问角色', 'roles')
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
    columns: [new Column('字段名', 'name'), new Column('加密算法', 'alg')],
    mapper: new Mapper({
      name: {
        label: '字段名',
        type: 'Select',
        options: [],
        onDropdown: (open: boolean) => {
          if (open) {
            const model = Model.copy(
              store.getters['project/ins'].models.find(
                (mdl: Model) => mdl.key === store.getters['project/auth'].model
              )
            )
            signMapper['cmpProps'].emitter.emit('update:mprop', {
              'name.options': model.props
                .filter(prop => prop.name !== 'role')
                .map(prop => ({
                  label: prop.name,
                  value: prop.name
                }))
            })
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
    onSaved: async (cmpProp: any, cmpProps: any[]) => {
      signEmitter.emit('update:data', { cmpProps: cmpProps.concat(SgnProp.copy(cmpProp)) })
      signMapper['cmpProps'].show = false
    },
    onDeleted: async (key: any, cmpProps: any[]) => {
      cmpProps.splice(
        cmpProps.findIndex((prop: any) => prop.key === key),
        1
      )
      signEmitter.emit('update:data', { cmpProps })
      signMapper['cmpProps'].show = false
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
