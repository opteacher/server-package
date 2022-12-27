<template>
  <a-descriptions class="mb-12" :column="1" bordered size="small">
    <template #title>
      <control-outlined />
      &nbsp;表单参数
    </template>
    <a-descriptions-item label="标题">
      <a-input
        v-model:value="formState.title"
        @blur="(e: any) => api.form.save({ title: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="表单宽度">
      <a-input-number
        class="w-full"
        v-model:value="formState.width"
        :min="1"
        :max="100"
        @blur="(e: any) => api.form.save({ width: e.target.value })"
      >
        <template #addonAfter><percentage-outlined /></template>
      </a-input-number>
    </a-descriptions-item>
    <a-descriptions-item label="标签宽度">
      <a-input-number
        class="w-full"
        v-model:value="formState.labelWidth"
        :min="1"
        :max="23"
        @blur="(e: any) => api.form.save({ labelWidth: e.target.value })"
      >
        <template #addonAfter>/ 24</template>
      </a-input-number>
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Form from '@lib/types/form'
import { defineComponent, reactive } from 'vue'
import { mdlAPI as api } from '@/apis'
import { ControlOutlined, PercentageOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'TableProps',
  components: {
    ControlOutlined,
    PercentageOutlined
  },
  props: {
    form: { type: Form, required: true }
  },
  setup(props) {
    const formState = reactive(props.form)
    return {
      api,
      formState
    }
  }
})
</script>
