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
        :label-col="{ span: lgnProps.hasLabel ? lgnProps.lblWidth : 0 }"
        :wrapper-col="{ span: lgnProps.hasLabel ? 24 - lgnProps.lblWidth : 24 }"
        @finish="onFinish"
      >
        <FormItem v-for="field in lgnFields" :key="field.key" :field="field" :form="{}" />

        <a-form-item v-if="lgnProps.logAccount" name="remember">
          <a-checkbox>记住</a-checkbox>
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
import { defineComponent, reactive } from 'vue'
import FormItem from '../components/FormItem.vue'
import MidLgn from '../types/midLgn'
import Field from '../types/field'

export default defineComponent({
  name: 'Login',
  components: {
    FormItem
  },
  setup() {
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

    function onFinish(values: any) {
      console.log(values)
    }
    return {
      lgnProps,
      lgnFields,

      onFinish
    }
  }
})
</script>
