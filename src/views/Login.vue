<template>
  <div
    :style="{
      height: '100%',
      padding: '25vh 10vw',
      'background-image': `url(${require('@/assets/0123d75647240f6ac7251c948e1f59.jpg')})`,
      'background-size': '100% 100%'
    }"
  >
    <div
      :style="{
        width: '30vw',
        float: 'right',
        padding: '5vh 3vw',
        background: 'rgba(256, 256, 256, 0.9)',
        'border-radius': '4px'
      }"
    >
      <a-form
        name="登录"
        :model="formState"
        :label-col="{ span: 5 }"
        :wrapper-col="{ span: 19 }"
        autocomplete="off"
        @finish="onFinish"
      >
        <a-form-item label="模式" name="mode">
          <a-switch
            :checked="formState.mode === '登录'"
            @change="checked => (checked ? (formState.mode = '登录') : (formState.mode = '注册'))"
          />
          &nbsp;{{ formState.mode }}
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

        <a-form-item :wrapper-col="{ offset: 5, span: 19 }">
          <a-button type="primary" html-type="submit">{{ formState.mode }}</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { GlobalOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'Login',
  components: {
    GlobalOutlined
  },
  setup() {
    const formState = reactive({
      mode: '登录',
      name: '',
      password: '',
      repeatPwd: '',
      code: ''
    })

    async function onFinish(validState: any) {
      console.log(validState)
    }
    return {
      formState,

      onFinish
    }
  }
})
</script>
