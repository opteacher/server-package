<template>
  <a-descriptions class="mb-50" :column="1" bordered size="small">
    <template #title>
      <control-outlined />
      &nbsp;表单参数
    </template>
    <a-descriptions-item label="标题">
      <a-input
        v-model:value="form.title"
        @change="(e: any) => api.form.save({ title: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="表单宽度">
      <a-input-number
        class="w-100"
        v-model:value="form.width"
        :min="1"
        :max="100"
        :formatter="(value: any) => `${value}%`"
        @blur="(width: any) => api.form.save({ width })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="标签宽度">
      <a-input-number
        class="w-100"
        v-model:value="form.labelWidth"
        :min="1"
        :max="23"
        @blur="(labelWidth: any) => api.form.save({ labelWidth })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Form from '@/types/form'
import { defineComponent } from 'vue'
import { mdlAPI as api } from '@/apis'
import { ControlOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'TableProps',
  components: {
    ControlOutlined
  },
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
