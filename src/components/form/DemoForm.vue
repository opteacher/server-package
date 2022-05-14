<template>
  <a-modal
    v-model:visible="visible"
    :title="form.title"
    :width="`${form.width}vw`"
    @ok="onOkClick"
    @cancel="onCclClick"
  >
    <a-form
      ref="formRef"
      :model="formState"
      :label-col="{ span: form.labelWidth }"
      :wrapper-col="{ span: 24 - form.labelWidth }"
    >
      <a-form-item v-for="field in fields" :key="field.key">
        <template #label>
          {{ field.label }}&nbsp;
          <a-tooltip v-if="field.desc">
            <template #title>{{ field.desc }}</template>
            <InfoCircleOutlined style="color: #1890ff" />
          </a-tooltip>
        </template>
        <template v-if="viewOnly">
          <template
            v-if="
              field.ftype === 'Input' ||
              field.ftype === 'Number' ||
              field.ftype === 'Delable' ||
              field.ftype === 'SelOrIpt' ||
              field.ftype === 'DateTime'
            "
          >
            {{ formState[field.refer] }}
          </template>
          <template v-else-if="field.ftype === 'Textarea'">
            <pre>{{ formState[field.refer] }}</pre>
          </template>
          <template v-else-if="field.ftype === 'Select' || field.ftype === 'Cascader'">
            {{ fmtDrpdwnValue(field.extra.options, formState[field.refer]) }}
          </template>
          <template v-else-if="field.ftype === 'Checkbox'">
            {{ formState[field.refer] ? '是' : '否' }}
          </template>
          <template v-else-if="field.ftype === 'Table'">
            <a-table
              :columns="field.extra.columns"
              :data-source="formState[field.refer]"
              :pagination="false"
              size="small"
            />
          </template>
        </template>
        <template v-else>
          <a-input v-if="field.ftype === 'Input'" v-model:value="formState[field.refer]" />
          <a-checkbox
            v-else-if="field.ftype === 'Checkbox'"
            v-model:value="formState[field.refer]"
          />
          <a-select
            v-else-if="field.ftype === 'Select'"
            class="w-100"
            v-model:value="formState[field.refer]"
          />
          <a-input-number
            v-else-if="field.ftype === 'Number'"
            class="w-100"
            v-model:value="formState[field.refer]"
          />
        </template>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import Field from '@/types/field'
import Form from '@/types/form'
import { computed, defineComponent, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { InfoCircleOutlined } from '@ant-design/icons-vue'
import Model from '@/types/model'
import { BaseTypes, OpnType } from '@/types'

export default defineComponent({
  name: 'DemoForm',
  emits: ['submit'],
  props: {
    emitter: { type: Emitter, required: true }
  },
  components: {
    InfoCircleOutlined
  },
  setup(props, { emit }) {
    const store = useStore()
    const visible = ref(false)
    const formRef = ref()
    const viewOnly = ref(false)
    const model = computed(() => store.getters['model/ins'] as Model)
    const form = computed(() => store.getters['model/form'] as Form)
    const formState = reactive(
      Object.fromEntries(model.value.props.map(prop => [prop.name, toDefault(prop.ptype)]))
    )
    const fields = computed(() => store.getters['model/fields'] as Field[])

    props.emitter.on('update:show', async (options: { show: boolean; record?: any }) => {
      if (options.show) {
        await store.dispatch('model/refresh')
      }
      visible.value = options.show
      if (options.record) {
        for (const prop of Object.keys(options.record)) {
          formState[prop] = options.record[prop]
        }
      }
    })
    props.emitter.on('viewOnly', (vwOnly: boolean) => {
      viewOnly.value = vwOnly
    })

    function reset() {
      for (const prop of model.value.props) {
        formState[prop.name] = toDefault(prop.ptype)
      }
    }
    async function onOkClick() {
      try {
        await formRef.value.validate()
        emit('submit', formState, () => {
          visible.value = false
          reset()
        })
      } catch (e) {
        console.error(e)
      }
    }
    function onCclClick() {
      visible.value = false
      reset()
    }
    function toDefault(type: BaseTypes) {
      switch (type) {
        case 'String':
          return ''
        case 'Number':
          return 0
        case 'DateTime':
          return new Date()
        case 'Boolean':
          return false
        case 'Array':
          return []
        case 'Object':
          return {}
        case 'Any':
        case 'Unknown':
          return undefined
      }
    }
    function fmtDrpdwnValue(options: OpnType[], value: any | any[]) {
      if (value instanceof Array) {
        const vals = []
        if (!options || !options.length) {
          return value.join(' / ')
        }
        let opns = options
        for (let i = 0; i < value.length; ++i) {
          const opn = opns.find((opn: OpnType) => opn.value === value[i])
          if (opn) {
            vals.push(opn.label || opn.value)
          } else {
            vals.push(value[i])
          }
          if (i === value.length - 1) {
            break
          }
          opns = opn?.children as OpnType[]
        }
        return vals.join(' / ')
      } else {
        const opn = options.find((opn: OpnType) => opn.value === value)
        return opn ? opn.label || opn.value : value
      }
    }
    return {
      visible,
      form,
      formRef,
      formState,
      viewOnly,
      fields,

      onOkClick,
      onCclClick,
      toDefault,
      fmtDrpdwnValue
    }
  }
})
</script>
