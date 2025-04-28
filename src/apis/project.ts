import store from '@/store'
import CmpIns from '@/types/cmpIns'
import DataBase from '@/types/database'
import Project from '@/types/project'
import Transfer from '@/types/transfer'
import Typo from '@/types/typo'
import {
  RequestOptions,
  downloadFile,
  getObjKey,
  pickOrIgnore,
  reqAll,
  reqDelete,
  reqGet,
  reqPost,
  reqPut,
  setProp
} from '@/utils'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { saveAs } from 'file-saver'
import { createVNode } from 'vue'

import { pjtAPI } from '.'
import API from '@/types/api'
import Status from '@/types/status'

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
  remove: (data: any) => reqDelete('project', data.key, { type: 'api' }),
  update: (data: any) =>
    reqPut(
      'project',
      data.key,
      data.database ? setProp(data, 'database', getObjKey(data.database)) : data,
      {
        ignores: ['models', 'auth', 'middle', 'status', 'services', 'typos']
      }
    ),
  all: (options: RequestOptions) =>
    reqAll('project', { ...options, copy: Project.copy, axiosConfig: { params: { _ext: true } } }),
  detail: async (key: any) => {
    const project = (await reqGet('project', key, { copy: Project.copy })) as Project
    await Promise.all(
      project.typos.map(async typo => Typo.copy(await reqGet('typo', typo.key), typo))
    )
    return project
  },
  databases: () => reqAll('database', { copy: DataBase.copy }),
  sync: (key: string) =>
    reqPut('project', key, undefined, {
      type: 'api',
      action: 'sync',
      middles: {
        before: () => {
          store.commit('project/SET_STATUS', 'loading')
        }
      },
      messages: {
        loading: '同步中……',
        succeed: '同步成功！'
      }
    }),
  syncFrt: async (key: string, form: any) => {
    await reqPut('project', key, { 'front.dist': form.dir })
    return reqPut('project', `${key}/sync`, undefined, { type: 'api' }).then(() => {
      setTimeout(() => store.dispatch('project/refresh'), 10)
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
      copy: Status.copy,
      messages: { notShow: true }
    }),
  apis: (key: string) =>
    reqGet('project', `${key}/apis`, { type: 'api', copy: API.copy, messages: { notShow: true } }),
  docker: {
    expImg: async (key: string, name?: string) => {
      const resp = await reqGet('project', `${key}/docker/image/export`, {
        type: 'api',
        orgRes: true,
        axiosConfig: { timeout: 120000, responseType: 'blob' }
      })
      saveAs(new Blob([resp.data], { type: resp.headers['content-type'] }), name)
    },
    runCmd: (key: string, query?: any) =>
      reqGet('project', key, {
        type: 'api',
        action: 'docker/runCmd',
        axiosConfig: { params: query }
      })
  },
  logs: {
    access: (key: string) =>
      reqGet('project', key, { type: 'api', action: 'docker/logs/access/mqtt' }),
    exit: (key: string) => reqDelete('project', `${key}/docker/logs/exit`, { type: 'api' })
  },
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
          { axiosConfig: { params: { _updMode: 'merge' } } }
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
            { axiosConfig: { params: { _updMode: 'append' } } }
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
          while (cmpIns.parent) {
            cmpIns = cmpIns.parent
            childKey = `children[{key:${cmpIns.key}}].` + childKey
          }
          childKey = childKey.replace('key:', '_id:')
          await reqPut(
            'project',
            pkey,
            { [`middle.dashboard.${childKey}`]: null },
            { axiosConfig: { params: { _updMode: 'delete' } } }
          )
          if (next) {
            await next()
          }
        },
        save: async (key: string, data: any) =>
          reqPut(
            'project',
            store.getters['project/ins'].key,
            { [`middle.dashboard.children[{_id:${key}}]`]: data },
            { axiosConfig: { params: { _updMode: 'merge' } } }
          ),
        child: {
          opera: async (
            pkey: string,
            ckey: string,
            props: string,
            data: any = null,
            _updMode = 'cover',
            next?: () => Promise<any>
          ) => {
            await reqPut(
              'project',
              pkey,
              {
                [`middle.dashboard.children[{_id:${ckey}}].${props}`]: data
              },
              { axiosConfig: { params: { _updMode } } }
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
    generate: async (key: any) =>
      downloadFile(
        await reqGet('project', `${key}/middle/generate`, {
          type: 'api',
          axiosConfig: { responseType: 'blob' },
          messages: { notShow: true },
          orgRes: true
        })
      ),
    deploy: (key: any, data: any) =>
      reqPut('project', `${key}/middle/deploy`, data, { type: 'api' })
  }
}
