import { Deploy, Model, Project, Route, Transfer } from '@/common'
import { makeRequest, reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import axios from 'axios'
import { Dispatch } from 'vuex'

export default {
  namespaced: true,
  state: new Project(),
  mutations: {},
  actions: {
    async refresh ({ state }: { state: Project }, pid?: string) {
      Project.copy((await reqGet('project', pid || state.key)).data, state)
      for (const index in state.models) {
        const model = state.models[index]
        Model.copy((await reqGet('model', model.key)).data, model)
      }
    },
    async save ({ dispatch, state }: { dispatch: Dispatch, state: Project }, project: Project) {
      await reqPut('project', state.key, project, { ignores: ['models'] })
      await dispatch('refresh')
    },
    async update ({ dispatch }: { dispatch: Dispatch }, payload: {
      opera: any,
      parent: [string, any],
      child: [string, any],
      ignores?: string[]
    }) {
      if (typeof payload.opera !== 'string') {
        if (payload.opera.key) {
          // 更新
          await reqPut(payload.child[1], payload.opera.key, payload.opera, {
            ignores: payload.ignores
          })
          await dispatch('refresh')
          return
        } else {
          // 新增
          const newOne = (await reqPost(payload.child[1], payload.opera, {
            ignores: payload.ignores
          })).data
          payload.child[1] = newOne._id
        }
      } else {
        // 删除
        await reqDelete(payload.opera, payload.child[1])
      }
      await reqLink({
        parent: payload.parent,
        child: payload.child
      }, typeof payload.opera !== 'string')
      await dispatch('refresh')
    },
    async setRoutePath ({ dispatch }: { dispatch: Dispatch }, route: Route) {
      await reqPut('route', route.key, { path: route.path }, { ignores: ['flow'] })
      await dispatch('refresh')
    },
    async del ({ state }: { state: Project }) {
      await axios.delete(`/server-package/api/v1/project/${state.key}`)
    },
    async sync ({ dispatch, state }: { dispatch: Dispatch, state: Project }) {
      state.status = 'starting'
      await makeRequest(axios.put(`/server-package/api/v1/project/${state.key}/sync`), {
        messages: {
          loading: '同步中……',
          succeed: '同步成功！'
        }
      })
      await dispatch('refresh')

      const h = setInterval(async () => {
        try {
          let host = ''
          if (process.env.ENV === 'prod') {
            host = `http://${state.name}:${state.port}`
          }
          await axios.get(`${host}/${state.name}/mdl/v1`)
        } catch (e) {
          console.log(`等待项目${state.name}启动……`)
        }
        clearInterval(h)
        state.status = 'running'
      }, 1000)
    },
    async stop ({ dispatch, state }: { dispatch: Dispatch, state: Project }) {
      await makeRequest(axios.put(`/server-package/api/v1/project/${state.key}/stop`), {
        middles: {
          before: () => {
            state.status = 'stopping'
          },
          after: () => {
            state.status = 'stopped'
          }
        },
        messages: {
          loading: '停止中……',
          succeed: '操作成功！'
        }
      })
      await dispatch('refresh')
    },
    async deploy ({ state }: { state: Project }, config: Deploy) {
      const orgSts = state.status
      await makeRequest(axios.put(`/server-package/api/v1/project/${state.key}/deploy`, config), {
        middles: {
          before: () => {
            state.status = 'deploying'
          },
          after: () => {
            state.status = orgSts
          }
        },
        messages: {
          loading: '部署中……',
          succeed: '部署成功！'
        }
      })
    },
    async transfer ({ state }: { state: Project }, info: Transfer) {
      const url = `/server-package/api/v1/project/${state.key}/transfer`
      const orgSts = state.status
      await makeRequest(axios.put(url, {
        name: state.name,
        files: info.file.map((file: any) => ({
          src: file.response.result,
          dest: [
            // `${state.name}:/app/`, 这一步骤放在后端操作
            info.dest.startsWith('/') ? '' : '/',
            info.dest ? info.dest + '/' : '',
            file.originFileObj.webkitRelativePath || file.name
          ].join('')
        }))
      }), {
        middles: {
          before: () => {
            state.status = 'transferring'
          },
          after: () => {
            state.status = orgSts
          }
        },
        messages: {
          loading: '传输中……',
          succeed: '传输成功！'
        }
      })
    }
  },
  getters: {
    ins: (state: Project): Project => state
  }
}
