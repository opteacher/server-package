import { makeRequest } from '@/utils'
import axios from 'axios'
import { RouteRecordRaw, createRouter, createWebHistory } from 'vue-router'

import Auth from '../views/Auth.vue'
import Component from '../views/Compo.vue'
import Dash from '../views/Dash.vue'
import Database from '../views/Database.vue'
import Demo from '../views/Demo.vue'
import Dependency from '../views/Dep.vue'
import Flow from '../views/Flow.vue'
import Form from '../views/Form.vue'
import Home from '../views/Home.vue'
import Login from '../views/Login.vue'
import MidDsb from '../views/MidDsb.vue'
import MidLgn from '../views/MidLgn.vue'
import MidNav from '../views/MidNav.vue'
import Model from '../views/Model.vue'
import Project from '../views/Project.vue'
import Table from '../views/Table.vue'
import Test from '../views/Test.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: Login
  },
  {
    path: '/dash',
    name: 'Dashboard',
    component: Dash,
    meta: { reqLogin: true }
  },
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/home',
    name: 'Home',
    component: Home,
    meta: { reqLogin: true }
  },
  {
    path: '/database',
    name: 'Database',
    component: Database,
    meta: { reqLogin: true }
  },
  {
    path: '/dependency',
    name: 'Dependency',
    component: Dependency,
    meta: { reqLogin: true }
  },
  {
    path: '/component',
    name: 'Component',
    component: Component,
    meta: { reqLogin: true }
  },
  {
    path: '/test',
    name: 'Test',
    component: Test
  },
  {
    path: '/project/:pid',
    name: 'Project',
    component: Project,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/model/:mid',
    name: 'Model',
    component: Model,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/flow/:sid',
    name: 'Flow',
    component: Flow,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/auth',
    name: 'Authorization',
    component: Auth,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/mid/login',
    name: 'MiddleLogin',
    component: MidLgn,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/mid/navigate',
    name: 'MiddleNavigate',
    component: MidNav,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/mid/dashboard',
    name: 'MiddleDashboard',
    component: MidDsb,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/model/:mid/form',
    name: 'Form',
    component: Form,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/model/:mid/table',
    name: 'Table',
    component: Table,
    meta: { reqLogin: true }
  },
  {
    path: '/project/:pid/model/:mid/demo',
    name: 'Demo',
    component: Demo,
    meta: { reqLogin: true }
  }
]

const router = createRouter({
  history: createWebHistory('server-package'),
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
        path: '/login',
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
