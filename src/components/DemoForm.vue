<template>
  <a-modal v-model:visible="visible" :title="form.title" @ok="onOkClick" @cancel="onCclClick">
    <a-form
      :width="`${form.width}vw`"
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
        <a-input v-if="field.type === 'Input'" />
        <a-select v-else-if="field.type === 'Select'" class="w-100" />
        <a-input-number v-else-if="field.type === 'Number'" class="w-100" />
        <a-checkbox v-else-if="field.type === 'Checkbox'" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
import Field from '@/types/field'
import Form from '@/types/form'
import { computed, defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { InfoCircleOutlined } from '@ant-design/icons-vue'

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
    const form = computed(() => store.getters['model/form'] as Form)
    const fields = computed(() => Object.values(store.getters['model/fields']) as Field[])

    props.emitter.on('update:show', async (show: boolean) => {
      if (show) {
        await store.dispatch('model/refresh')
      }
      visible.value = show
    })

    function onOkClick() {
      emit('submit')
      visible.value = false
    }
    function onCclClick() {
      visible.value = false
    }
    return {
      visible,
      form,
      fields,

      onOkClick,
      onCclClick
    }
  }
})
</script>
