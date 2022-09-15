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
      <DmFormItem
        v-for="field in fields"
        :key="field.key"
        :field="field"
        :form="formState"
        :viewOnly="viewOnly"
      />
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import Field from '@/types/field'
import Form from '@/types/form'
import { computed, defineComponent, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Model from '@/types/model'
import { BaseTypes } from '@/types'
import DmFormItem from '@/components/form/DmFormItem.vue'
import type { Dayjs } from 'dayjs'

export default defineComponent({
  name: 'DemoForm',
  emits: ['submit'],
  props: {
    emitter: { type: Emitter, required: true }
  },
  components: {
    DmFormItem
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
        case 'LongStr':
          return ''
        case 'Number':
          return 0
        case 'DateTime':
          return ref<Dayjs>()
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
    return {
      visible,
      form,
      formRef,
      formState,
      viewOnly,
      fields,

      onOkClick,
      onCclClick,
      toDefault
    }
  }
})
</script>
