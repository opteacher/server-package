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
      <a-form-item v-for="field in Object.values(fields)" :key="field.key">
        <template #label>
          {{ field.label }}&nbsp;
          <a-tooltip v-if="field.desc">
            <template #title>{{ field.desc }}</template>
            <InfoCircleOutlined style="color: #1890ff" />
          </a-tooltip>
        </template>
        <a-input v-if="field.type === 'Input'" v-model:value="formState[refToProp(field.refer)]" />
        <a-checkbox
          v-else-if="field.type === 'Checkbox'"
          v-model:value="formState[refToProp(field.refer)]"
        />
        <a-select
          v-else-if="field.type === 'Select'"
          class="w-100"
          v-model:value="formState[refToProp(field.refer)]"
        />
        <a-input-number
          v-else-if="field.type === 'Number'"
          class="w-100"
          v-model:value="formState[refToProp(field.refer)]"
        />
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
import { BaseTypes } from '@/types'

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
    const model = computed(() => store.getters['model/ins'] as Model)
    const form = computed(() => store.getters['model/form'] as Form)
    const formState = reactive(
      Object.fromEntries(model.value.props.map(prop => [prop.name, toDefault(prop.type)]))
    )
    const fields = computed(() => Object.values(store.getters['model/fields']) as Field[])

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

    function reset() {
      for (const prop of model.value.props) {
        formState[prop.name] = toDefault(prop.type)
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
    function refToProp(refer: string) {
      const result = /@\w+/.exec(refer)
      return result ? result[0].substring(1) : ''
    }
    return {
      visible,
      form,
      formRef,
      formState,
      fields,

      onOkClick,
      onCclClick,
      toDefault,
      refToProp
    }
  }
})
</script>
