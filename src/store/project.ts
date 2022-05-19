/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Model from '@/types/model'
import Project from '@/types/project'
import router from '@/router'
import { Dispatch } from 'vuex'
import { pjtAPI } from '../apis'
import Auth from '@/types/auth'
import API from '@/types/api'

type PjtState = { project: Project; apis: API[] }

export default {
  namespaced: true,
  state: {
    project: new Project(),
    apis: [] as API[]
  } as PjtState,
  mutations: {
    SET_STATUS(state: PjtState, payload: 'loading' | 'running' | 'stopped') {
      state.project.status = payload
    }
  },
  actions: {
    async refresh({ dispatch, state }: { dispatch: Dispatch; state: PjtState }) {
      if (!router.currentRoute.value.params.pid) {
        return
      }
      const pid = router.currentRoute.value.params.pid
      Project.copy(await pjtAPI.detail(pid), state.project)
      if (state.project.thread) {
        dispatch('chkStatus')
      }
      state.apis = (await pjtAPI.apis(pid)).map((api: any) => API.copy(api))
    },
    chkStatus({ state }: { state: PjtState }) {
      let countdown = 0
      const chkFun = async () => {
        state.project.status = await pjtAPI.status(state.project.key)
        if (state.project.status === 'loading') {
          console.log(`等待项目${state.project.name}启动……，已等待${countdown}秒`)
          if (countdown > 15 * 60) {
            console.log('已超过15分钟，项目启动失败！')
            state.project.status = 'stopped'
            clearInterval(h)
          } else {
            ++countdown
          }
          return
        }
        clearInterval(h)
        console.log(
          `项目${state.project.name}已成功${state.project.status === 'running' ? '启动' : '停止'}！`
        )
      }
      const h = setInterval(chkFun, 5000)
      chkFun()
    }
  },
  getters: {
    ins: (state: PjtState): Project => state.project,
    model:
      (state: PjtState) =>
      (mkey: string): Model =>
        state.project.models.find((mdl: Model) => mdl.key === mkey) as Model,
    auth: (state: PjtState): Auth => state.project.auth,
    apis: (state: PjtState): API[] => state.apis
  }
}
