import store from '@/store'
import {
  endsWith,
  makeRequest,
  pickOrIgnore,
  reqAll,
  reqDelete,
  reqGet,
  reqPost,
  reqPut
} from '@/utils'
import Project from '@/types/project'
import Transfer from '@/types/transfer'
import DataBase from '@/types/database'
import { Modal } from 'ant-design-vue'
import { createVNode } from 'vue'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import axios from 'axios'
import { pjtAPI } from '.'
import CmpIns from '@/types/cmpIns'

function searchCmpIns(cmpIns: { key: string; children: CmpIns[] }, skey: string): CmpIns | null {
  if (cmpIns.key === skey) {
    return cmpIns as CmpIns
  }
  for (const subCmpIns of cmpIns.children) {
    const ret = searchCmpIns(subCmpIns, skey)
    if (ret) {
      return ret
    }
  }
  return null
}

export default {
  add: (data: any) =>
    reqPost('project', Object.assign(data, { auth: { roles: [{ name: 'guest', rules: [{}] }] } })),
  remove: (key: any) => reqDelete('project', key, { type: 'api' }),
  update: (data: any) =>
    reqPut('project', data.key, data, { ignores: ['models', 'auth', 'middle', 'status'] }),
  all: (offset: number, limit: number) =>
    reqAll('project', { axiosConfig: { params: { offset, limit } }, copy: Project.copy }),
  detail: (key: any) => reqGet('project', key).then((pjt: any) => Project.copy(pjt)),
  databases: () =>
    reqAll('database').then((result: any[]) => result.map((org: any) => DataBase.copy(org))),
  sync: (key: string) => {
    Modal.confirm({
      title: '确定（重）启动项目？',
      icon: createVNode(ExclamationCircleOutlined),
      onOk: async () => {
        await reqPut('project', `${key}/sync`, undefined, {
          type: 'api',
          middles: {
            before: () => {
              store.commit('project/SET_STATUS', 'loading')
            }
          },
          messages: {
            loading: '同步中……',
            succeed: '同步成功！'
          }
        })
        setTimeout(() => store.dispatch('project/refresh'), 10)
      }
    })
  },
  stop: (key: string) => {
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
            }
          },
          messages: {
            loading: '停止中……',
            succeed: '操作成功！'
          }
        })
        setTimeout(() => store.dispatch('project/refresh'), 10)
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
  status: (key: string) =>
    reqGet('project', `${key}/stat`, {
      type: 'api',
      messages: { notShow: true }
    }),
  apis: (key: string) => reqGet('project', `${key}/apis`, { type: 'api' }),
  middle: {
    login: {
      save: async (key: string, data: any, next?: () => Promise<any>) => {
        await reqPut('project', key, { 'middle.login': data })
        if (next) {
          await next()
        }
      }
    },
    navigate: {
      save: async (key: string, data: any, next?: () => Promise<any>) => {
        await reqPut('project', key, { 'middle.navigate': data })
        if (next) {
          await next()
        }
      }
    },
    dashboard: {
      save: async (key: string, data: any, next?: () => Promise<any>) => {
        await reqPut(
          'project',
          key,
          { 'middle.dashboard': pickOrIgnore(data, ['children']) },
          { axiosConfig: { params: { updMode: 'merge' } } }
        )
        if (next) {
          await next()
        }
      },
      compo: {
        add: async (key: string, data: any, next?: () => Promise<any>) => {
          await reqPut(
            'project',
            key,
            { 'middle.dashboard.children': data },
            { axiosConfig: { params: { updMode: 'append' } } }
          )
          if (next) {
            await next()
          }
        },
        remove: async (pkey: string, ckey: string, next?: () => Promise<any>) => {
          const project = Project.copy(await pjtAPI.detail(pkey))
          let cmpIns = searchCmpIns(project.middle.dashboard, ckey)
          if (!cmpIns) {
            return
          }
          let childKey = `children[{key:${cmpIns.key}}]`
          while(cmpIns.parent) {
            cmpIns = cmpIns.parent
            childKey = `children[{key:${cmpIns.key}}].` + childKey
          }
          childKey = childKey.replace('key:', '_id:')
          await reqPut(
            'project',
            pkey,
            { [`middle.dashboard.${childKey}`]: null },
            { axiosConfig: { params: { updMode: 'delete' } } }
          )
          if (next) {
            await next()
          }
        },
        save: async (key: string, data: any) => reqPut(
          'project',
          store.getters['project/ins'].key,
          { [`middle.dashboard.children[{_id:${key}}]`]: data },
          { axiosConfig: { params: { updMode: 'merge' } } }
        ),
        child: {
          opera: async (
            pkey: string,
            ckey: string,
            props: string,
            data: any = null,
            updMode = 'cover',
            next?: () => Promise<any>
          ) => {
            await reqPut(
              'project',
              pkey,
              {
                [`middle.dashboard.children[{_id:${ckey}}].${props}`]: data
              },
              { axiosConfig: { params: { updMode } } }
            )
            if (next) {
              await next()
            }
          }
        }
      }
    },
    publish: (key: any, data: any) =>
      reqPost(`project/${key}/middle/publish`, data, { type: 'api' }),
    status: (key: any) =>
      reqGet('project', `${key}/middle/status`, { type: 'api', messages: { notShow: true } }),
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
