import store from '@/store'
import { reqAll, reqDelete, reqGet, reqPost, reqPut } from '@/utils'
import Project from '@/types/project'
import Transfer from '@/types/transfer'
import DataBase from '@/types/database'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'

export default {
  add: (data: any) =>
    reqPost('project', Object.assign(data, { auth: { roles: [{ name: 'guest', rules: [{}] }] } })),
  remove: (key: any) => reqDelete('project', key, { type: 'api' }),
  update: (data: any) => reqPut('project', data.key, data, { ignores: ['models'] }),
  all: (offset: number, limit: number) =>
    reqAll('project', { query: { offset, limit }, copy: Project.copy }),
  detail: (key: any) => reqGet('project', key).then((pjt: any) => Project.copy(pjt)),
  databases: () =>
    reqAll('database').then((result: any[]) => result.map((org: any) => DataBase.copy(org))),
  sync: (key: any) => {
    Modal.confirm({
      title: '确定（重）启动项目？',
      icon: createVNode(ExclamationCircleOutlined),
      onOk: async () => {
        await reqPut('project', `${key}/sync`, undefined, {
          type: 'api',
          messages: {
            loading: '同步中……',
            succeed: '同步成功！'
          }
        })
        await store.dispatch('project/refresh')
      }
    })
  },
  stop: (key: any) => {
    Modal.confirm({
      title: '确定停止项目？',
      icon: createVNode(ExclamationCircleOutlined),
      content: createVNode('div', { style: 'color:red;' }, '项目停止后相关服务也暂停！'),
      onOk: async () => {
        await reqPut('project', `${key}/stop`, undefined, {
          type: 'api',
          middles: {
            before: () => {
              store.commit('project/SET_STATUS', 'loading')
            },
            after: () => {
              store.commit('project/SET_STATUS', 'stopped')
            }
          },
          messages: {
            loading: '停止中……',
            succeed: '操作成功！'
          }
        })
        await store.dispatch('project/refresh')
      }
    })
  },
  transfer: (info: Transfer) => {
    const project = store.getters['project/ins']
    return reqPut(
      'project',
      `${project.key}/transfer`,
      {
        name: project.name,
        files: info.file.map((file: any) => ({
          src: file.response.result,
          dest: [
            // `${project.name}:/app/`, 这一步骤放在后端操作
            info.dest.startsWith('/') ? '' : '/',
            info.dest ? info.dest + '/' : '',
            file.originFileObj.webkitRelativePath || file.name
          ].join('')
        }))
      },
      {
        type: 'api',
        middles: {
          before: () => {
            store.commit('project/SET_STATUS', 'loading')
          },
          after: () => {
            store.commit('project/SET_STATUS', 'running')
          }
        },
        messages: {
          loading: '传输中……',
          succeed: '传输成功！'
        }
      }
    )
  },
  status: (key: any) =>
    reqGet('project', `${key}/stat`, {
      type: 'api',
      messages: { notShow: false }
    }).then((pjt: any) => pjt.status),
  apis: (key: any) => reqGet('project', `${key}/apis`, { type: 'api' }),
  middle: {
    login: {
      save: (key: any, data: any) => reqPut('project', key, { 'middle.login': data })
    },
    navigate: {
      save: (key: any, data: any) => reqPut('project', key, { 'middle.navigate': data })
    },
    publish: async (key: any, data: any) => {
      const result = await reqPost(`project/${key}/middle/publish`, data, { type: 'api' })
      store.commit('project/SET_MID_URL', result.midURL)
    },
    status: (key: any) => reqGet('project', `${key}/middle/status`, { type: 'api' }),
  }
}
