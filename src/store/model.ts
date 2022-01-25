import { Model, Project } from '@/common'
import { makeRequest, reqGet } from '@/utils'
import axios from 'axios'

type ModelState = { pid: string, model: Model, dataset: any[] }

export default {
  namespaced: true,
  state: {
    pid: '',
    model: new Model(),
    dataset: [] as any[]
  },
  mutations: {},
  actions: {
    async refresh ({ state }: { state: ModelState }, ids?: [string, string]) {
      Model.copy((await reqGet('model', ids ? ids[1] : state.model.key)).data, state.model)
      // for (const idx in state.model.props) {
      //   Property.copy((await reqGet('property', getKey(state.model.props[idx]))).data, state.model.props[idx])
      // }
      // for (const idx in state.model.routes) {
      //   Route.copy((await reqGet('route', getKey(state.model.routes[idx]))).data, state.model.routes[idx])
      // }
      const project = Project.copy((await reqGet('project', ids ? ids[0] : state.pid)).data)
      const host = process.env.ENV === 'prod' ? project.name : '127.0.0.1'
      state.dataset = (await makeRequest(axios.get([
        `http://${host}:${project.port}`,
        `/${project.name}/mdl/v1/${state.model.name}s`
      ].join('')))).data
    },
  },
  getters: {
    ins: (state: ModelState): Model => state.model,
    dataset: (state: ModelState): any[] => state.dataset
  }
}
