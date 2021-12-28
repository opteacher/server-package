import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import(/* webpackChunkName: 'about' */ '../views/Home.vue'),
  },
  {
    path: '/project/:pid',
    name: 'Project',
    component: () => import(/* webpackChunkName: 'about' */ '../views/Project.vue'),
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
