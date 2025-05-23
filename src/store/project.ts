/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import router from '@/router'
import API from '@/types/api'
import Auth from '@/types/auth'
import Middle from '@/types/middle'
import Model from '@/types/model'
import Project from '@/types/project'
import Status from '@/types/status'
import { intervalCheck } from '@/utils'
import { Dispatch } from 'vuex'

import { depAPI, pjtAPI } from '../apis'
import Dep from '@/types/dep'

type PjtState = { project: Project; apis: API[]; deps: Dep[] }

export default {
  namespaced: true,
  state: {
    project: new Project(),
    apis: [],
    deps: []
  },
  mutations: {
    SET_STATUS(state: PjtState, payload: 'loading' | 'running' | 'stopped') {
      state.project.status.stat = payload
    },
    SET_MID_URL(state: PjtState, payload: string) {
      state.project.middle.url = payload
    }
  },
  actions: {
    async refresh({ dispatch, state }: { dispatch: Dispatch; state: PjtState }) {
      if (!router.currentRoute.value.params.pid) {
        return
      }
      const pid = router.currentRoute.value.params.pid as string
      state.project = await pjtAPI.detail(pid)
      dispatch('chkStatus', state.project.thread ? 'running' : 'stopped')
      state.apis = await pjtAPI.apis(pid)
      state.deps = await Promise.all([depAPI.all(), depAPI.allByPjt(true)]).then(ress => ress.flat())
    },
    chkStatus({ state }: { state: PjtState }, expect: 'running' | 'stopped') {
      const msgTxt = expect === 'running' ? '启动' : '停止'
      intervalCheck({
        chkFun: async () => {
          try {
            state.project.status = await pjtAPI.status(state.project.key)
          } catch (e: any) {
            return false
          }
          return expect === state.project.status.stat
        },
        middle: {
          waiting: (countdown: number) => {
            console.log(`等待项目${state.project.name}${msgTxt}……，已等待${countdown << 2}秒`)
          },
          failed: () => {
            console.log(`已超过15分钟，项目${msgTxt}失败！`)
            state.project.status.stat = expect === 'running' ? 'stopped' : 'running'
          },
          succeed: () => {
            console.log(
              `项目${state.project.name}已成功${
                state.project.status.stat === 'running' ? '启动' : '停止'
              }！`
            )
          }
        },
        interval: 5000,
        limit: 15 * 60
      })
    },
    chkMidStatus({ state }: { state: PjtState }) {
      if (!state.project.key) {
        return
      }
      state.project.middle.loading = true
      intervalCheck({
        chkFun: async () => {
          const result = await pjtAPI.middle.status(state.project.key)
          if (state.project.status.stat !== 'running') {
            return true
          }
          if (result.status === 'published') {
            state.project.middle.url = result.midURL
            return true
          }
          return false
        },
        middle: {
          waiting: (countdown: number) => {
            console.log(`等待中台${state.project.name}启动……，已等待${countdown << 2}秒`)
          },
          failed: () => {
            console.log(`已超过15分钟，中台启动失败！`)
            state.project.middle.loading = false
          },
          succeed: () => {
            console.log(`项目${state.project.name}的中台已成功启动！`)
            state.project.middle.loading = false
          }
        },
        interval: 4000,
        limit: 15 * 60
      })
    }
  },
  getters: {
    key: (state: PjtState): string => state.project.key,
    ins: (state: PjtState): Project => state.project,
    models: (state: PjtState) => state.project.models,
    model:
      (state: PjtState) =>
      (mkey: string): Model =>
        state.project.models.find((mdl: Model) => mdl.key === mkey) as Model,
    auth: (state: PjtState): Auth => state.project.auth,
    apis: (state: PjtState): API[] => state.apis,
    deps: (state: PjtState): Dep[] => state.deps,
    middle: (state: PjtState): Middle => state.project.middle
  }
}
