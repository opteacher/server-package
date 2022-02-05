import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Project from '../views/Project.vue'
import Flow from '../views/Flow.vue'
import DataSet from '../views/DataSet.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/server-package',
    name: 'Home',
    component: Home
  },
  {
    path: '/server-package/project/:pid',
    name: 'Project',
    component: Project
  },
  {
    path: '/server-package/project/:pid/flow/:aid',
    name: 'Flow',
    component: Flow
  },
  {
    path: '/server-package/project/:pid/dataset/:mid',
    name: 'DataSet',
    component: DataSet
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
