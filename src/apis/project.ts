import store from '@/store'
import { reqAll, reqDelete, reqGet, reqPost, reqPut } from '@/utils'
import Project from '@/types/project'
import Transfer from '@/types/transfer'
import DataBase from '@/types/database'

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
  sync: async (key: any) => {
    await reqPut('project', `${key}/sync`, undefined, {
      type: 'api',
      messages: {
        loading: '同步中……',
        succeed: '同步成功！'
      }
    })
    await store.dispatch('project/refresh')
  },
  stop: async (key: any) => {
    await reqPut('project', `${key}/stop`, undefined, {
      type: 'api',
      middles: {
        before: () => {
          store.commit('SET_STATUS', 'loading')
        },
        after: () => {
          store.commit('SET_STATUS', 'stopped')
        }
      },
      messages: {
        loading: '停止中……',
        succeed: '操作成功！'
      }
    })
    await store.dispatch('project/refresh')
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
            store.commit('SET_STATUS', 'loading')
          },
          after: () => {
            store.commit('SET_STATUS', 'running')
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
    }).then((pjt: any) => pjt.status)
}
