<template>
  <a-descriptions title="组件特殊参数" :column="1" bordered size="small">
    <a-descriptions-item label="占位提示">
      <a-input class="w-100" />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Field from '@/types/field'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'InputProps',
  props: {
    field: { type: Field, required: true }
  }
})
</script>
