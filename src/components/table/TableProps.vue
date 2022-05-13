<template>
  <a-descriptions class="mb-50" title="表参数" :column="1" bordered size="small">
    <a-descriptions-item label="标题">
      <a-input
        :value="table.title"
        @change="e => store.dispatch('model/saveTable', { title: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="描述">
      <a-input
        :value="table.desc"
        @change="e => store.dispatch('model/saveTable', { desc: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="操作风格">
      <a-select
        class="w-100"
        :options="[
          { label: '按钮', value: 'button' },
          { label: '链接', value: 'link' }
        ]"
        :value="table.operaStyle"
        @change="operaStyle => store.dispatch('model/saveTable', { operaStyle })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="尺寸">
      <a-select
        class="w-100"
        :options="['default', 'middle', 'small'].map(item => ({ label: item, value: item }))"
        :value="table.size"
        @change="size => store.dispatch('model/saveTable', { size })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="页码">
      <a-input-group>
        <a-row :gutter="4">
          <a-col :span="6">
            <a-checkbox
              :style="{ 'vertical-align': 'middle', 'line-height': '30px' }"
              :checked="table.hasPages"
              @change="e => store.dispatch('model/saveTable', { hasPages: e.target.checked })"
            >
              {{ table.hasPages ? '有' : '无' }}
            </a-checkbox>
          </a-col>
          <a-col :span="18">
            <a-input-number :disabled="!table.hasPages" class="w-100" />
          </a-col>
        </a-row>
      </a-input-group>
    </a-descriptions-item>
    <a-descriptions-item label="操作可否">
      <a-checkbox-group
        :value="table.operable"
        :options="['可增加', '可编辑', '可删除']"
        @change="operable => store.dispatch('model/saveTable', { operable })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Table from '@/types/table'
import { defineComponent } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'TableProps',
  props: {
    table: { type: Table, required: true }
  },
  setup() {
    const store = useStore()
    return {
      store
    }
  }
})
</script>
