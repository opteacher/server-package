import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
/*return hasAuth ? 'import Login from \'../views/Login.vue\'' : ''*/

const routes: Array<RouteRecordRaw> = [
  {
    path: '//*return project.name*//',
    redirect: '//*return project.name*//home'
  },
  {
    path: '//*return project.name*//home',
    name: 'Home',
    component: Home
  },
  /*return hasAuth ? `{\n    path: \'/${project.name}/login\',\n    name: \'Login\',\n    component: Login\n  }` : ''*/
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
