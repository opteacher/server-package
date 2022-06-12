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
      <FormItem
        v-for="field in form.fields"
        :key="field.key"
        :field="field"
        :form="formState"
        :viewOnly="viewOnly"
      />
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import { defineComponent, reactive, ref } from 'vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import FormItem from './FormItem.vue'

export default defineComponent({
  name: 'FormDialog',
  components: { FormItem },
  emits: ['submit'],
  props: {
    emitter: { type: Emitter, required: true },
    form: { type: Object, required: true }
  },
  setup(props, { emit }) {
    const visible = ref(false)
    const formRef = ref()
    const formState = reactive({})
    const viewOnly = ref(false)

    props.emitter.on('update:show', (args: { show: boolean; record?: any; viewOnly?: boolean }) => {
      viewOnly.value = args.viewOnly as boolean
      visible.value = args.show
    })

    async function onOkClick() {
      try {
        await formRef.value.validate()
        emit('submit', formState, () => {
          visible.value = false
          // reset()
        })
      } catch (e) {
        console.error(e)
      }
    }
    function onCclClick() {
      visible.value = false
      // reset()
    }
    return {
      visible,
      viewOnly,
      formRef,
      formState,

      onOkClick,
      onCclClick
    }
  }
})
</script>
