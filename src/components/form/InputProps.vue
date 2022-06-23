<template>
  <a-descriptions title="组件特殊参数" :column="1" bordered size="small">
    <a-descriptions-item label="前缀"></a-descriptions-item>
    <a-descriptions-item label="后缀"></a-descriptions-item>
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
