/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Model from '@/types/model'
import Project from '@/types/project'
import router from '@/router'
import { Dispatch } from 'vuex'
import { pjtAPI } from '../apis'
import Auth from '@/types/auth'

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
      const chkFun = async () => {
        state.status = await pjtAPI.status(state.key)
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
      }
      const h = setInterval(chkFun, 5000)
      chkFun()
    }
  },
  getters: {
    ins: (state: Project): Project => state,
    model:
      (state: Project) =>
      (mkey: string): Model => {
        return state.models.find((mdl: Model) => mdl.key === mkey) as Model
      },
    auth: (state: Project): Auth => state.auth
  }
}
