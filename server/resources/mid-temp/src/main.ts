import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import './styles.less'
import axios from 'axios'

axios.interceptors.request.use(
  function (config) {
    const token = `Bearer ${localStorage.getItem('token')}`
    if (token) {
      if (!config.headers) {
        config.headers = { authorization: token }
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

createApp(App).use(Antd).use(router).mount('#app')
