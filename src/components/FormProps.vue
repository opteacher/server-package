<template>
  <a-descriptions class="mb-50" title="表单参数" :column="1" bordered size="small">
    <a-descriptions-item label="标题">
      <a-input :value="form.title" @change="e => api.saveForm({ title: e.target.value })" />
    </a-descriptions-item>
    <a-descriptions-item label="表单宽度">
      <a-input-number
        class="w-100"
        :value="form.width"
        :min="1"
        :max="100"
        :formatter="value => `${value}%`"
        @change="width => api.saveForm({ width })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="标签宽度">
      <a-input-number
        class="w-100"
        :value="form.labelWidth"
        :min="1"
        :max="23"
        @change="labelWidth => api.saveForm({ labelWidth })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Form from '@/types/form'
import { defineComponent } from 'vue'
import { mdlAPI as api } from '../apis'

export default defineComponent({
  name: 'TableProps',
  props: {
    form: { type: Form, required: true }
  },
  setup() {
    return {
      api
    }
  }
})
</script>
