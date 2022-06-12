import { makeRequest } from '../utils'
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'
import axios from 'axios'
/*return auth ? 'import Login from \'../views/Login.vue\'' : ''*/

const routes: Array<RouteRecordRaw> = [
  {
    path: '//*return project.name*//',
    redirect: '//*return project.name*//home'
  },
  {
    path: '//*return project.name*//home',
    name: 'Home',
    component: Home,
    meta: { reqLogin: true }
  },
  /*return auth ? `{\n    path: \'/${project.name}/login\',\n    name: \'Login\',\n    component: Login\n  }` : ''*/
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (to.matched.some(record => record.meta.reqLogin) /*return `&& ${auth != null}`*/) {
    try {
      const result = await makeRequest(
        axios.post([
          '' /*return `\'/${project.name}\'`*/,
          '/api/v1/',
          '' /*return auth ? `\'${auth.name}\'` : ''*/,
          '/verify'
        ].join(''), {
          headers: { authorization: 'Bearer ' + (localStorage.getItem('token') || '') }
        })
      )
      if (result.error) {
        throw new Error(result.data.error)
      }
      next()
    } catch (e) {
      next({
        path: '//*return project.name*//login',
        query: {
          redirect: to.fullPath
        }
      })
    }
  } else {
    next() // 确保一定要调用 next()
  }
})

export default router
