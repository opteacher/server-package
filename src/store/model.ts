/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model } from '@/common'
import router from '@/router'
import { makeRequest, reqGet } from '@/utils'
import axios from 'axios'

type ModelState = { model: Model; dataset: any[] }

export default {
  namespaced: true,
  state: {
    model: new Model(),
    dataset: [] as any[]
  },
  mutations: {},
  actions: {
    async refresh({ state }: { state: ModelState }) {
      if (!router.currentRoute.value.params.pid || !router.currentRoute.value.params.mid) {
        return
      }
      const mid = router.currentRoute.value.params.mid
      Model.copy((await reqGet('model', mid)).data, state.model)
      const pid = router.currentRoute.value.params.pid
      state.dataset = (await makeRequest(axios.get(`/server-package/api/v1/project/${pid}/model/${mid}/data`))).result
    }
  },
  getters: {
    ins: (state: ModelState): Model => state.model,
    dataset: (state: ModelState): any[] => state.dataset
  }
}
