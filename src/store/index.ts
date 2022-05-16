import { createStore } from 'vuex'
import model from './model'
import project from './project'
import service from './service'
import admin from './admin'

export default createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    project,
    service,
    model,
    admin
  }
})
