<template>
  <div
    class="h-full flex items-center justify-end bg-cover"
    :style="{
      'background-image': '@/assets/background.png'
    }"
  >
    <div class="w-1/3 px-14 py-8 mr-50 bg-white rounded">
      <a-form
        name="登录"
        :model="formState"
        layout="vertical"
        autocomplete="off"
        @finish="onFinish"
      >
        <a-form-item name="title">
          <template #label>
            <a-typography-title>
              <smile-outlined />
              登录主面板
            </a-typography-title>
          </template>
          <a-typography-paragraph>
            无代码后台编辑平台，原服务器自用包发展而来，所以名字也被沿用。
          </a-typography-paragraph>
        </a-form-item>
        <a-form-item
          label="用户名"
          name="name"
          :rules="[{ required: true, message: '请输入用户名！' }]"
        >
          <a-input v-model:value="formState.name" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="password"
          :rules="[{ required: true, message: '请输入密码！' }]"
        >
          <a-input-password v-model:value="formState.password" />
        </a-form-item>

        <a-form-item
          v-if="formState.mode === '注册'"
          label="重复密码"
          name="repeatPwd"
          :rules="[{ required: true, message: '请重复密码！' }]"
        >
          <a-input-password v-model:value="formState.repeatPwd" />
        </a-form-item>

        <a-form-item
          v-if="formState.mode === '注册'"
          label="验证码"
          name="code"
          :rules="[{ required: true, message: '请输入验证码！' }]"
        >
          <a-input v-model:value="formState.code" />
        </a-form-item>

        <a-form-item>
          <a-button class="w-full mb-2" type="primary" size="large" html-type="submit">
            {{ formState.mode }}
          </a-button>
          <a-typography-text v-if="formState.mode === '登录'" type="secondary">
            不是管理员，先
            <a @click="formState.mode = '注册'">注册</a>
            ！
          </a-typography-text>
          <a-typography-text v-else type="secondary">
            已是管理员，直接
            <a @click="formState.mode = '登录'">登录</a>
            ！
          </a-typography-text>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Admin from '@/types/admin'
import { makeRequest } from '@/utils'
import axios from 'axios'
import { defineComponent, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { SmileOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'Login',
  components: {
    SmileOutlined
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const formState = reactive(Admin.copy({ mode: '登录' }))

    onMounted(async () => {
      const loginToken = localStorage.getItem('loginToken')
      if (loginToken) {
        const result = await makeRequest(
          axios.get('/server-package/api/v1/log/verify', {
            headers: { authorization: 'Bearer ' + loginToken }
          })
        )
        if (!result.error) {
          router.replace('/')
        }
      }
    })

    async function onFinish(validState: Admin) {
      if (formState.mode === '注册') {
        await store.dispatch('admin/regup', validState)
      } else {
        await store.dispatch('admin/login', validState)
      }
    }
    return {
      formState,

      onFinish
    }
  }
})
</script>
