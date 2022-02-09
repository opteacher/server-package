/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { Deploy, Model, Project, Role, Transfer } from '@/common'
import router from '@/router'
import { makeRequest, reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import { modelEmitter, propEmitter, svcEmitter } from '@/views/Project'
import axios from 'axios'
import { Dispatch } from 'vuex'

export default {
  namespaced: true,
  state: new Project(),
  mutations: {},
  actions: {
    async refresh({ dispatch, state }: { dispatch: Dispatch; state: Project }) {
      if (!router.currentRoute.value.params.pid) {
        return
      }
      const pid = router.currentRoute.value.params.pid
      Project.copy(await reqGet('project', pid || state.key), state)
      for (const index in state.models) {
        const model = state.models[index]
        Model.copy(await reqGet('model', model.key), model)
      }
      for (const index in state.roles) {
        const role = state.roles[index]
        Role.copy(await reqGet('role', role.key), role)
      }
      dispatch('chkStatus')
    },
    async save({ dispatch, state }: { dispatch: Dispatch; state: Project }, project: Project) {
      await reqPut('project', state.key, project, { ignores: ['models'] })
      await dispatch('refresh')
    },
    async update(
      { dispatch }: { dispatch: Dispatch },
      payload: {
        opera: any
        parent: [string, any]
        child: [string, any]
        ignores?: string[]
      }
    ) {
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
          const newOne = await reqPost(payload.child[1], payload.opera, {
            ignores: payload.ignores
          })
          payload.child[1] = newOne._id
        }
      } else {
        // 删除
        await reqDelete(payload.opera, payload.child[1])
      }
      await reqLink(
        {
          parent: payload.parent,
          child: payload.child
        },
        typeof payload.opera !== 'string'
      )
      await dispatch('refresh')
    },
    async del({ state }: { state: Project }) {
      await axios.delete(`/server-package/api/v1/project/${state.key}`)
    },
    async sync({ dispatch, state }: { dispatch: Dispatch; state: Project }) {
      state.status = 'loading'
      await makeRequest(axios.put(`/server-package/api/v1/project/${state.key}/sync`), {
        messages: {
          loading: '同步中……',
          succeed: '同步成功！'
        }
      })
      await dispatch('refresh')
    },
    chkStatus({ state }: { state: Project }) {
      let countdown = 0
      const h = setInterval(async () => {
        state.status = (
          await makeRequest(axios.get(`/server-package/api/v1/project/${state.key}/stat`), {
            messages: { notShow: false }
          })
        ).result.status
        if (state.status === 'loading') {
          console.log(`等待项目${state.name}启动……，已等待${countdown}秒`)
          if (countdown > 15 * 60) {
            console.log('已超过15分钟，项目启动失败！')
            state.status = 'stopped'
            clearInterval(h)
          } else {
            ++countdown
          }
          return
        }
        clearInterval(h)
        console.log(`项目${state.name}已成功${state.status === 'running' ? '启动' : '停止'}！`)
      }, 1000)
    },
    async stop({ dispatch, state }: { dispatch: Dispatch; state: Project }) {
      await makeRequest(axios.put(`/server-package/api/v1/project/${state.key}/stop`), {
        middles: {
          before: () => {
            state.status = 'loading'
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
    async deploy({ state }: { state: Project }, config: Deploy) {
      const orgSts = state.status
      await makeRequest(axios.put(`/server-package/api/v1/project/${state.key}/deploy`, config), {
        middles: {
          before: () => {
            state.status = 'loading'
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
    async transfer({ state }: { state: Project }, info: Transfer) {
      const url = `/server-package/api/v1/project/${state.key}/transfer`
      const orgSts = state.status
      await makeRequest(
        axios.put(url, {
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
        }),
        {
          middles: {
            before: () => {
              state.status = 'loading'
            },
            after: () => {
              state.status = orgSts
            }
          },
          messages: {
            loading: '传输中……',
            succeed: '传输成功！'
          }
        }
      )
    },
    async restartSvcJob({ dispatch }: { dispatch: Dispatch }, svcKey: string) {
      await makeRequest(
        axios.post(`/server-package/api/v1/service/${svcKey}/job/restart`, undefined, {
          params: { pid: router.currentRoute.value.params.pid }
        })
      )
      await dispatch('refresh')
    },
    async stopSvcJob({ dispatch }: { dispatch: Dispatch }, svcKey: string) {
      await makeRequest(
        axios.delete(`/server-package/api/v1/service/${svcKey}/job/stop`, {
          params: { pid: router.currentRoute.value.params.pid }
        })
      )
      await dispatch('refresh')
    }
  },
  getters: {
    ins: (state: Project): Project => state,
    model:
      (state: Project) =>
      (mkey: string): Model => {
        return state.models.find((mdl: Model) => mdl.key === mkey) as Model
      }
  }
}
