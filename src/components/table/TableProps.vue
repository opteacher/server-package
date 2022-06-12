<template>
  <a-descriptions class="mb-50" title="表参数" :column="1" bordered size="small">
    <a-descriptions-item label="标题">
      <a-input
        v-model:value="formState.title"
        @blur="(e: any) => api.table.save({ title: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="描述">
      <a-input
        v-model:value="formState.desc"
        @blur="(e: any) => api.table.save({ desc: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="操作风格">
      <a-select
        class="w-100"
        :options="[
          { label: '按钮', value: 'button' },
          { label: '链接', value: 'link' }
        ]"
        :value="formState.operaStyle"
        @change="(operaStyle: any) => api.table.save({ operaStyle })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="尺寸">
      <a-select
        class="w-100"
        :options="['default', 'middle', 'small'].map(item => ({ label: item, value: item }))"
        :value="formState.size"
        @change="(size: any) => api.table.save({ size })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="页码">
      <a-input-group>
        <a-row :gutter="4">
          <a-col :span="6">
            <a-checkbox
              :style="{ 'vertical-align': 'middle', 'line-height': '30px' }"
              :checked="formState.hasPages"
              @change="(e: any) => api.table.save({ hasPages: e.target.checked })"
            >
              {{ formState.hasPages ? '有' : '无' }}
            </a-checkbox>
          </a-col>
          <a-col :span="18">
            <a-input-number :disabled="!formState.hasPages" class="w-100" />
          </a-col>
        </a-row>
      </a-input-group>
    </a-descriptions-item>
    <a-descriptions-item label="操作可否">
      <a-checkbox-group
        :value="formState.operable"
        :options="['可增加', '可编辑', '可删除']"
        @change="(operable: any) => api.table.save({ operable })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Table from '@/types/table'
import { defineComponent, reactive } from 'vue'
import { useStore } from 'vuex'
import { mdlAPI as api } from '../../apis'

export default defineComponent({
  name: 'TableProps',
  props: {
    table: { type: Table, required: true }
  },
  setup(props) {
    const store = useStore()
    const formState = reactive(props.table)
    return {
      store,
      api,
      formState
    }
  }
})
</script>
