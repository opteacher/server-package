<template>
  <a-modal
    v-model:visible="visible"
    :title="form.title"
    :width="`${form.width}vw`"
    @ok="onOkClick"
    @cancel="emitter.emit('update:show', false)"
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
    <template v-if="viewOnly" #footer>
      <a-button @click="emitter.emit('update:show', false)">Cancel</a-button>
    </template>
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

    props.emitter.on(
      'update:show',
      (args: { show: boolean; cpyRcd?: (tgt: any) => void; viewOnly?: boolean }) => {
        if (!args.show) {
          visible.value = false
          return
        }
        viewOnly.value = typeof args.viewOnly != 'undefined' ? args.viewOnly : false
        if (args.cpyRcd) {
          args.cpyRcd(formState)
        }
        visible.value = args.show
      }
    )

    async function onOkClick() {
      try {
        await formRef.value.validate()
        emit('submit', formState, () => {
          props.emitter.emit('update:show', false)
        })
      } catch (e) {
        console.error(e)
      }
    }
    return {
      visible,
      viewOnly,
      formRef,
      formState,

      onOkClick
    }
  }
})
</script>
