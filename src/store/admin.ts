/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Admin } from '@/common'
import router from '@/router'
import { makeRequest } from '@/utils'
import { message, notification } from 'ant-design-vue'
import axios from 'axios'
import { Dispatch } from 'vuex'

export default {
  namespaced: true,
  state: new Admin(),
  mutations: {},
  actions: {
    async regup({ dispatch }: { dispatch: Dispatch }, admin: any) {
      const result = (await makeRequest(axios.post('/server-package/api/v1/log/regup', admin)))
        .result
      if (result.error) {
        notification.error({
          message: '注册时发生错误！',
          description: result.error
        })
        return
      }
      message.success('注册成功！')
      await dispatch('login', admin)
    },
    async login({ state }: { state: Admin }, admin: any) {
      const result = (await makeRequest(axios.post('/server-package/api/v1/log/in', admin))).result
      if (result.error) {
        notification.error({
          message: '登录失败！',
          description: result.error
        })
        return
      }
      Admin.copy(result.admin, state)
      localStorage.setItem('loginToken', result.token)
      message.success(result.message)
      router.replace((router.currentRoute.value.query['redirect'] as string) || '/server-package/')
    }
  },
  getters: {
    ins: (state: Admin): Admin => state
  }
}
