import { Model, Project } from '@/common'
import { makeRequest, reqGet, reqPut } from '@/utils'
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
      await reqPut('project', state.key, project, { ignores: ['key', 'models'] })
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
          await axios.get(`/${state.name}/mdl/v1`)
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
    }
  },
  getters: {
    ins: (state: Project): Project => state
  }
}
