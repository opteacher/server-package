<template>
  <div
    :style="{
      padding: '0 24px',
      height: `${lgnProps.height}px`,
      display: 'flex',
      'align-items': 'center',
      'justify-content': lgnProps.align,
      'background-color': lgnProps.bkgdColor
    }"
  >
    <a-form
      :style="{
        padding: '16px 20px 0 20px',
        'border-radius': `${lgnProps.radius}px`,
        width: `${lgnProps.width}%`,
        'background-color': lgnProps.fmBkgdColor
      }"
      :label-col="{ span: lgnProps.hasLabel ? lgnProps.lblWidth : 0 }"
      :wrapper-col="{ span: lgnProps.hasLabel ? 24 - lgnProps.lblWidth : 24 }"
    >
      <FormItem v-for="field in lgnFields" :key="field.key" :field="fixField(field)" :form="{}" />

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
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive } from 'vue'
import FormItem from '../components/FormItem.vue'
import { useRoute } from 'vue-router'
import MidLgn from '../types/midLgn'
import Field from '../types/field'
import pjtAPI from '../apis/project'
import mdlAPI from '../apis/model'

export default defineComponent({
  name: 'Login',
  components: {
    FormItem
  },
  setup() {
    const route = useRoute()
    const lgnProps = reactive(new MidLgn())
    const lgnFields = reactive([] as Field[])

    onMounted(async () => {
      const pid = route.params.pid
      const project = await pjtAPI.detail(pid)
      MidLgn.copy(project.middle.login, lgnProps)
      if (project.auth.model) {
        const model = await mdlAPI.detail(project.auth.model)
        const fldsMapper = Object.fromEntries(
          model.form.fields.map((field: any) => [field.refer, field])
        )
        lgnFields.splice(0, lgnFields.length)
        for (const prop of project.auth.props) {
          lgnFields.push(fldsMapper[prop.name])
        }
      }
    })

    function fixField(field: Field): Field {
      if (!lgnProps.hasLabel) {
        const ret = Field.copy(field)
        ret.label = ''
        return ret
      }
      return field
    }
    return {
      lgnProps,
      lgnFields,

      fixField
    }
  }
})
</script>
