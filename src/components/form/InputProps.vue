<template>
  <a-descriptions title="组件特殊参数" :column="1" bordered size="small">
    <a-descriptions-item label="占位提示">
      <a-input
        class="w-100"
        :value="field.extra.placeholder"
        @change="
          e =>
            api.form.fields.save({
              key: field.key,
              extra: Object.assign(field.extra || {}, { placeholder: e.target.value })
            })
        "
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Field from '@/types/field'
import { defineComponent } from 'vue'
import { mdlAPI as api } from '@/apis'

export default defineComponent({
  name: 'InputProps',
  props: {
    field: { type: Field, required: true }
  },
  setup() {
    return {
      api
    }
  }
})
</script>
