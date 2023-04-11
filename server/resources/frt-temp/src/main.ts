import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import MyLib from '@lib/index'
import Antd from 'ant-design-vue'
import '@lib/assets/main.css'
import 'ant-design-vue/dist/antd.css'

createApp(App).use(router).use(Antd).use(MyLib).mount('#app')
