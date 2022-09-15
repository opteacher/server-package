import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Login from '../views/Login.vue'
import Home from '../views/Home.vue'
import Database from '../views/Database.vue'
import Component from '../views/Compo.vue'
import Dependency from '../views/Dep.vue'
import Project from '../views/Project.vue'
import Model from '../views/Model.vue'
import Flow from '../views/Flow.vue'
import Auth from '../views/Auth.vue'
import MidLgn from '../views/MidLgn.vue'
import MidNav from '../views/MidNav.vue'
import MidDsb from '../views/MidDsb.vue'
import Form from '../views/Form.vue'
import Table from '../views/Table.vue'
import Demo from '../views/Demo.vue'
import Test from '../views/Test.vue'
import axios from 'axios'
import { makeRequest } from '@/utils'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/server-package/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/server-package/home',
    redirect: '/server-package/'
  },
  {
    path: '/server-package',
    name: 'Home',
    component: Home,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/database',
    name: 'Database',
    component: Database,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/dependency',
    name: 'Dependency',
    component: Dependency,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/component',
    name: 'Component',
    component: Component,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/test',
    name: 'Test',
    component: Test
  },
  {
    path: '/server-package/project/:pid',
    name: 'Project',
    component: Project,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/model/:mid',
    name: 'Model',
    component: Model,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/model/:mid/flow/:sid',
    name: 'Flow',
    component: Flow,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/auth',
    name: 'Authorization',
    component: Auth,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/mid/login',
    name: 'MiddleLogin',
    component: MidLgn,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/mid/navigate',
    name: 'MiddleNavigate',
    component: MidNav,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/mid/dashboard',
    name: 'MiddleDashboard',
    component: MidDsb,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/model/:mid/form',
    name: 'Form',
    component: Form,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/model/:mid/table',
    name: 'Table',
    component: Table,
    meta: { reqLogin: true }
  },
  {
    path: '/server-package/project/:pid/model/:mid/demo',
    name: 'Demo',
    component: Demo,
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
      const result = await makeRequest(
        axios.get('/server-package/api/v1/log/verify', {
          headers: { authorization: 'Bearer ' + (localStorage.getItem('loginToken') || '') }
        })
      )
      if (result.error) {
        throw new Error(result.data.error)
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
