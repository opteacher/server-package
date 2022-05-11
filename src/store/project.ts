/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Deploy from '@/types/deploy'
import Model from '@/types/model'
import Project from '@/types/project'
import router from '@/router'
import { makeRequest, reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import axios from 'axios'
import { Dispatch } from 'vuex'
import { pjtAPI } from '../apis'

export default {
  namespaced: true,
  state: new Project(),
  mutations: {
    SET_STATUS(state: Project, payload: 'loading' | 'running' | 'stopped') {
      state.status = payload
    }
  },
  actions: {
    async refresh({ dispatch, state }: { dispatch: Dispatch; state: Project }) {
      if (!router.currentRoute.value.params.pid) {
        return
      }
      const pid = router.currentRoute.value.params.pid
      Project.copy(await pjtAPI.detail(pid), state)
      if (state.thread) {
        dispatch('chkStatus')
      }
    },
    chkStatus({ state }: { state: Project }) {
      let countdown = 0
      const h = setInterval(async () => {
        state.status = (
          await reqGet('project', `${state.key}/stat`, {
            type: 'api',
            messages: { notShow: false }
          })
        ).status
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
      }, 5000)
    },
    async restartSvcJob({ dispatch }: { dispatch: Dispatch }, svcKey: string) {
      await makeRequest(
        axios.post(
          `/server-package/api/v1/service/${svcKey}/job/restart`,
          {},
          {
            params: { pid: router.currentRoute.value.params.pid }
          }
        )
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
