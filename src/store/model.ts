/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExpClsForm, Model } from '@/common'
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
    async refresh({ state }: { state: ModelState }, ids?: [string, string]) {
      const mid = ids && ids.length ? ids[1] : router.currentRoute.value.params.mid
      Model.copy(await reqGet('model', mid), state.model)
      const pid = ids && ids.length ? ids[0] : router.currentRoute.value.params.pid
      state.dataset = (
        await makeRequest(axios.get(`/server-package/api/v1/project/${pid}/model/${mid}/data`))
      ).result
    },
    async export(_store: { state: ModelState }, expCls: ExpClsForm) {
      const pid = router.currentRoute.value.params.pid
      const result = (
        await makeRequest(
          axios.post(`/server-package/api/v1/project/${pid}/model/${expCls.key}/export`, expCls)
        )
      ).result

      const link = document.createElement('a')
      const body = document.querySelector('body')

      // 创建对象url
      link.href = window.URL.createObjectURL(new Blob([result.content]))
      link.download = result.fileName

      // fix Firefox
      link.style.display = 'none'
      body?.appendChild(link)

      link.click()
      body?.removeChild(link)

      // 通过调用 URL.createObjectURL() 创建的 URL 对象
      window.URL.revokeObjectURL(link.href)
    }
  },
  getters: {
    ins: (state: ModelState): Model => state.model,
    dataset: (state: ModelState): any[] => state.dataset
  }
}
