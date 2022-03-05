import { createApp } from 'vue'
import router from './router'
import store from './store'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'
import './styles.less'

createApp({ render: () => <router-view /> })
  .use(router)
  .use(store)
  .use(Antd)
  .mount('#app')
