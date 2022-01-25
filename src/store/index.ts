import { createStore } from 'vuex'
import model from './model'
import project from './project'
import route from './route'

export default createStore({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    project,
    route,
    model
  },
})
