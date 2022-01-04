import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import Project from '../views/Project.vue'
import Process from '../views/Process.vue'

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
    path: '/project/:pid/process/:rid',
    name: 'Process',
    component: Process
  }
]

const router = createRouter({
  history: createWebHistory('server-package'),
  routes
})

export default router
