<template>
  <a-descriptions class="mb-3" :column="1" bordered size="small">
    <template #title>
      <control-outlined />
      &nbsp;表单参数
    </template>
    <a-descriptions-item label="标题">
      <a-input
        v-model:value="formState.title"
        @blur="(e: any) => emit('update:form', { title: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="表单宽度">
      <a-input-number
        class="w-full"
        v-model:value="formState.width"
        :min="1"
        :max="100"
        @blur="(e: any) => emit('update:form', { width: e.target.value })"
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
        @blur="(e: any) => emit('update:form', { labelWidth: e.target.value })"
      >
        <template #addonAfter>/ 24</template>
      </a-input-number>
    </a-descriptions-item>
    <a-descriptions-item label="标签对齐">
      <a-select
        class="w-full"
        v-model:value="formState.labelAlign"
        :options="[
          { label: '左对齐', value: 'left' },
          { label: '右对齐', value: 'right' }
        ]"
        @change="(labelAlign: 'left' | 'right') => emit('update:form', { labelAlign })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts" setup name="FormProps">
import Form from '@/types/form'
import { ControlOutlined, PercentageOutlined } from '@ant-design/icons-vue'
import { cloneDeep } from 'lodash'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  form: { type: Form, required: true }
})
const emit = defineEmits(['update:form'])
const formState = ref(new Form())

onMounted(refresh)
watch(() => props.form, refresh, { deep: true })

function refresh() {
  formState.value = cloneDeep(props.form)
}
</script>
