'use strict'
import { createStore } from 'vuex'
import { reqGet } from '../utils'
import Model from '../types/model'
import Table from '../types/table'

export default createStore({
  state: {
    models: [],
    selMdls: [],
    table: new Table()
  },
  mutations: {},
  actions: {
    async refresh({ state }, selMkey = '') {
      const project = await reqGet('project', '61fce36eece4dc0134ed7829')
      state.models.splice(0, state.models.length, ...project.models.map(mdl => Model.copy(mdl)))
      state.selMdls.splice(0, state.selMdls.length)
      if (state.models.length) {
        let model = null
        if (selMkey) {
          model = state.models.find(mdl => mdl.key === selMkey)
        }
        if (!model) {
          model = state.models[0]
          state.selMdls.push(model.key)
        } else {
          state.selMdls.push(selMkey)
        }
        Table.copy(await reqGet('table', model.table), state.table)
        console.log(state.table)
      }
    }
  },
  modules: {},
  getters: {
    models: (state) => state.models,
    selMdls: (state) => state.selMdls,
    table: (state) => state.table
  }
})
