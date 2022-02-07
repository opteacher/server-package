/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Project } from '@/common'
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
      const project = Project.copy((await reqGet('project', pid)).data)
      const host = process.env.ENV === 'prod' ? project.name : '127.0.0.1'
      state.dataset = (
        await makeRequest(
          axios.get(
            [`http://${host}:${project.port}`, `/${project.name}/mdl/v1/${state.model.name}s`].join(
              ''
            )
          )
        )
      ).data
    }
  },
  getters: {
    ins: (state: ModelState): Model => state.model,
    dataset: (state: ModelState): any[] => state.dataset
  }
}
