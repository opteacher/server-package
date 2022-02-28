<template>
  <a-descriptions title="组件特殊参数" :column="1" bordered size="small">
    <a-descriptions-item label="占位提示">
      <a-input
        class="w-100"
        :value="field.extra.placeholder"
        @change="
          e =>
            store.dispatch('model/saveFieldExt', {
              fkey: field.key,
              extra: { placeholder: e.target.value }
            })
        "
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Field from '@/types/field'
import { defineComponent } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'InputProps',
  props: {
    field: { type: Field, required: true }
  },
  setup() {
    const store = useStore()
    return {
      store
    }
  }
})
</script>
