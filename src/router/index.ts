import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import Project from '../views/Project.vue'
import Flow from '../views/Flow.vue'
import DataSet from '../views/DataSet.vue'
import Auth from '../views/Auth.vue'
import axios from 'axios'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/server-package/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/server-package',
    name: 'Home',
    component: Home,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid',
    name: 'Project',
    component: Project,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/flow/:aid',
    name: 'Flow',
    component: Flow,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/dataset/:mid',
    name: 'DataSet',
    component: DataSet,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/authorization',
    name: 'Authorization',
    component: Auth,
    meta: { reqLogin: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (to.matched.some(record => record.meta.reqLogin)) {
    try {
      const resp = await axios.get(`/server-package/api/v1/log/verify`, {
        headers: { authorization: localStorage.getItem('loginToken') || '' }
      })
      if (resp.data.result || resp.data.result.error) {
        throw new Error(resp.data.result.error)
      }
      next()
    } catch (e) {
      next({
        path: '/server-package/login',
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
