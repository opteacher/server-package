import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import axios, { AxiosRequestHeaders } from 'axios'
import Antd from 'ant-design-vue'
import MyLib from './lib/frontend-library/src/index'
import './lib/frontend-library/src/assets/main.css'
import 'ant-design-vue/dist/reset.css'
import './styles.css'

axios.interceptors.request.use(
  function (config) {
    const token = `Bearer ${localStorage.getItem('loginToken')}`
    if (token) {
      if (!config.headers) {
        config.headers = { authorization: token } as unknown as AxiosRequestHeaders
      } else {
        config.headers['authorization'] = token
      }
    }
    return config
  },
  function (error) {
    // 对请求错误做些什么
    return Promise.reject(error)
  }
)

axios.defaults.paramsSerializer = function (params: any): string {
  const ret = []
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'undefined') {
      ret.push(key + '=')
    } else if (value === null) {
      ret.push(key + '=null')
    } else if (Array.isArray(value)) {
      ret.push(...value.map((val: any) => `${key}=${val}`))
    } else {
      ret.push(`${key}=${encodeURIComponent(value as string | number | boolean)}`)
    }
  }
  return ret.join('&')
}

createApp(App).use(store).use(router).use(Antd).use(MyLib).mount('#app')
