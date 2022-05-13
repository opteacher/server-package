<template>
  <a-descriptions title="组件特殊参数" :column="1" bordered size="small">
    <a-descriptions-item label="选项">
      <a-button class="w-100 mb-5" type="primary">添加选项</a-button>
      <a-input-group>
        <a-row :gutter="4">
          <a-col :span="9">
            <a-input v-model:value="optionState.label" />
          </a-col>
          <a-col :span="9">
            <a-input v-model:value="optionState.value" />
          </a-col>
          <a-col :span="6">
            <a-button type="primary" ghost>确定</a-button>
          </a-col>
        </a-row>
      </a-input-group>
      <template v-for="option of field.extra.options" :key="option.value"></template>
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Field from '@/types/field'
import { defineComponent, reactive } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'SelectProps',
  props: {
    field: { type: Field, required: true }
  },
  setup() {
    const store = useStore()
    const optionState = reactive({
      label: '',
      value: ''
    })
    return {
      store,
      optionState
    }
  }
})
</script>
