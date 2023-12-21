import { createStore } from 'vuex'
import model from './model'
import project from './project'
import node from './node'
import admin from './admin'

export default createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    project,
    model,
    admin,
    node
  }
})
