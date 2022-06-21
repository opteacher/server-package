<template>
  <div
    :style="{
      padding: '50px 24px',
      height: '100%',
      display: 'flex',
      'align-items': 'center',
      'justify-content': lgnProps.align,
      'background-color': lgnProps.bkgdColor
    }"
  >
    <div
      :style="{
        padding: '16px 20px 0 20px',
        'border-radius': `${lgnProps.radius}px`,
        width: `${lgnProps.width}%`,
        'background-color': lgnProps.fmBkgdColor
      }"
    >
      <h1 :style="{ 'font-size': '20pt', 'text-align': 'center', 'margin-bottom': '20px' }">
        {{ lgnProps.title }}
      </h1>
      <a-form
        :model="formState"
        :label-col="{ span: lgnProps.hasLabel ? lgnProps.lblWidth : 0 }"
        :wrapper-col="{ span: lgnProps.hasLabel ? 24 - lgnProps.lblWidth : 24 }"
        @finish="onFinish"
      >
        <FormItem v-for="field in lgnFields" :key="field.key" :field="field" :form="formState" />

        <a-form-item v-if="lgnProps.logAccount" name="remember">
          <a-checkbox v-model:checked="formState.remember">记住</a-checkbox>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit">登录</a-button>
          <template v-if="lgnProps.registerable">
            &nbsp;或&nbsp;
            <a href="">前往注册</a>
          </template>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive } from 'vue'
import FormItem from '../components/FormItem.vue'
import MidLgn from '../types/midLgn'
import Field from '../types/field'
import { useRouter } from 'vue-router'
import api from '../api'

export default defineComponent({
  name: 'Login',
  components: {
    FormItem
  },
  setup() {
    const router = useRouter()
    const lgnProps = reactive(MidLgn.copy('' /*return JSON.stringify(project.middle.login)*/))
    const lgnFields = reactive(
      [
        /*return fields.map(field => JSON.stringify(field)).join(',\n      ')*/
      ].map((field: any) => {
        const ret = Field.copy(field)
        if (!lgnProps.hasLabel) {
          ret.label = ''
        }
        return ret
      }) as Field[]
    )
    const formState = reactive(
      {} /*return JSON.stringify(Object.fromEntries(project.auth.props.map(prop => [prop.name, '']).concat([['remember', true]])))*/
    )

    onMounted(async () => {
      const token = localStorage.getItem('token')
      if (token) {
        const result = await api.verifyDeep(token)
        console.log(result)
        if (!result.error) {
          router.replace('//*return project.name*//home')
        }
      }
    })

    async function onFinish(values: any) {
      const result = await api.login(values)
      if (result.token) {
        localStorage.setItem('token', result.token)
        router.push('//*return project.name*//home')
      }
    }
    return {
      lgnProps,
      lgnFields,
      formState,

      onFinish
    }
  }
})
</script>
