import { createStore } from 'vuex'
import { reqGet } from '../utils'
import Model from '../types/model'
import Table from '../types/table'

export default createStore({
  state: {
    models: [],
    selMdls: [],
    table: null
  },
  mutations: {},
  actions: {
    async refresh({ state }) {
      const project = await reqGet('project', '621598da0c84c5b9ffc92b06')
      state.models.splice(0, state.models.length, ...project.models.map(mdl => Model.copy(mdl)))
      if (state.models.length) {
        if (!state.selMdls.length) {
          state.selMdls.splice(0, state.selMdls.length, state.models[0].key)
        }
        const lastSelMkey = state.selMdls[state.selMdls.length - 1]
        const model = state.models.find(mdl => mdl.key === lastSelMkey)
        console.log(model)
        // Table.copy(reqGet('table', project.table, state.table)
      } else {
        state.selMdls.splice(0, state.selMdls.length)
      }
    }
  },
  modules: {},
  getters: {
    models: (state) => state.models,
    selMdls: (state) => state.selMdls,
  }
})
