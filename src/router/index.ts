import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Project from '../views/Project.vue'
import Flow from '../views/Flow.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/project/:pid',
    name: 'Project',
    component: Project
  },
  {
    path: '/project/:pid/model/:mid/flow/:rid',
    name: 'Flow',
    component: Flow
  }
]

const router = createRouter({
  history: createWebHistory('server-package'),
  routes
})

export default router
