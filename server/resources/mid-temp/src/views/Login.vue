<template>
  <div
    class="px-5 py-12 h-full flex items-center"
    :style="{
      'justify-content': lgnProps.align,
      'background-color': lgnProps.bkgdColor
    }"
  >
    <div
      class="px-5 pt-4"
      :style="{
        'border-radius': `${lgnProps.radius}px`,
        width: `${lgnProps.width}%`,
        'background-color': lgnProps.fmBkgdColor
      }"
    >
      <h1 class="text-2xl text-center mb-5">
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
import Field from '@lib/types/field'
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
      if (localStorage.getItem('token')) {
        const result = await api.verifyDeep()
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
