<template>
  <a-descriptions class="mb-50" title="表单参数" :column="1" bordered size="small">
    <a-descriptions-item label="标题">
      <a-input
        :value="form.title"
        @change="e => store.dispatch('model/saveForm', { title: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="表单宽度">
      <a-input-number
        class="w-100"
        :value="form.width"
        :min="1"
        :max="100"
        :formatter="value => `${value}%`"
        @change="width => store.dispatch('model/saveForm', { width })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="标签宽度">
      <a-input-number
        class="w-100"
        :value="form.labelWidth"
        :min="1"
        :max="23"
        @change="labelWidth => store.dispatch('model/saveForm', { labelWidth })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Form from '@/types/form'
import { defineComponent } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'TableProps',
  props: {
    form: { type: Form, required: true }
  },
  setup() {
    const store = useStore()
    return {
      store
    }
  }
})
</script>
