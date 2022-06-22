import store from '@/store'
import { endsWith, makeRequest, reqAll, reqDelete, reqGet, reqPost, reqPut } from '@/utils'
import Project from '@/types/project'
import Transfer from '@/types/transfer'
import DataBase from '@/types/database'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import axios from 'axios'

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
    publish: (key: any, data: any) =>
      reqPost(`project/${key}/middle/publish`, data, { type: 'api' }),
    status: (key: any) => reqGet('project', `${key}/middle/status`, { type: 'api' }),
    generate: async (key: any) => {
      const resp = await makeRequest(
        axios.get(`/server-package/api/v1/project/${key}/middle/generate`, {
          responseType: 'blob'
        }),
        {
          messages: { notShow: true },
          orgRes: true
        }
      )
      const link = document.createElement('a')
      // 创建对象url
      link.href = window.URL.createObjectURL(
        new Blob([resp.data], { type: resp.headers['content-type'] })
      )
      const filename = window.decodeURI(resp.headers['content-disposition'].split('=')[1])
      link.download = filename.substring(
        filename.startsWith('"') ? 1 : 0,
        endsWith(filename, '"') ? filename.length - 1 : 0
      )
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      link.remove()
    },
    deploy: (key: any, data: any) =>
      reqPut('project', `${key}/middle/deploy`, data, { type: 'api' })
  }
}
