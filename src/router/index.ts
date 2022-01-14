import { createRouter, createWebHashHistory, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Project from '../views/Project.vue'
import Flow from '../views/Flow.vue'

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
    path: '/server-package/flow/:rid',
    name: 'Flow',
    component: Flow
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
