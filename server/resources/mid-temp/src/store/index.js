'use strict'
import axios from 'axios'
import { createStore } from 'vuex'
import { makeRequest, reqGet } from '../utils'
import Model from '../types/model'
import Table from '../types/table'
import Form from '../types/form'

export default createStore({
  state: {
    models: [],
    model: new Model(),
    table: new Table(),
    form: new Form(),
    records: []
  },
  mutations: {},
  actions: {
    async refresh({ state }, selMkey = '') {
      const project = await reqGet('project', '61fce36eece4dc0134ed7829')
      state.models.splice(0, state.models.length, ...project.models.map(mdl => Model.copy(mdl)))
      state.model = new Model()
      if (state.models.length) {
        if (selMkey) {
          state.model = state.models.find(mdl => mdl.key === selMkey)
        }
        if (!state.model.key) {
          state.model = state.models[0]
        }
        Table.copy(await reqGet('table', state.model.table), state.table)
        Form.copy(await reqGet('form', state.model.form), state.form)
        state.records = await makeRequest(axios.get(`/${project.name}/mdl/v1/${state.model.name}s`))
      }
    }
  },
  modules: {},
  getters: {
    models: state => state.models,
    model: state => state.model,
    table: state => state.table,
    form: state => state.form,
    records: state => state.records
  }
})
