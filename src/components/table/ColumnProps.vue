<template>
  <a-descriptions class="mb-50" title="列" :column="1" bordered size="small">
    <a-descriptions-item label="标题">
      <a-input
        :value="column.title"
        @change="
          e =>
            api.table.columns.save({
              key: column.key,
              title: e.target.value
            })
        "
      />
    </a-descriptions-item>
    <a-descriptions-item label="宽度">
      <a-input-number
        class="w-100"
        :value="column.width || 0"
        @change="width => api.table.columns.save({ key: column.key, width })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="对齐">
      <a-select
        class="w-100"
        :options="[
          { label: '左对齐', value: 'left' },
          { label: '居中对齐', value: 'center' },
          { label: '右对齐', value: 'right' }
        ]"
        :value="column.align || 'left'"
        @change="align => api.table.columns.save({ key: column.key, align })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="可排序">
      <a-switch
        :checked="column.sorter"
        @change="sortable => api.table.columns.save({ key: column.key, sortable })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="默认顺序">
      <a-select
        class="w-100"
        :options="[
          { label: '无', value: '' },
          { label: '升序', value: 'ascend' },
          { label: '降序', value: 'descend' }
        ]"
        :value="column.defaultSortOrder"
        @change="defaultSort => api.table.columns.save({ key: column.key, defaultSort })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Column from '@/types/column'
import { defineComponent } from 'vue'
import { mdlAPI as api } from '@/apis'

export default defineComponent({
  name: 'TableProps',
  props: {
    column: { type: Column, required: true }
  },
  setup() {
    return {
      api
    }
  }
})
</script>
