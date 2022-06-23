<template>
  <a-descriptions class="mb-50" title="列" :column="1" bordered size="small">
    <a-descriptions-item label="是否显示">
      <a-switch
        :checked="!colState.notDisplay"
        @change="(notDisplay: boolean) => api.table.columns.save({ key: colState.key, notDisplay })"
        checked-children="显示"
        un-checked-children="不显示"
      />
    </a-descriptions-item>
    <a-descriptions-item label="标题">
      <a-input
        v-model:value="colState.title"
        @blur="
          (e: any) =>
            api.table.columns.save({
              key: colState.key,
              title: e.target.value
            })
        "
      />
    </a-descriptions-item>
    <a-descriptions-item label="宽度">
      <a-input-number
        class="w-100"
        v-model:value="colState.width"
        @blur="(width: number) => api.table.columns.save({ key: colState.key, width })"
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
        :value="colState.align || 'left'"
        @change="(align: string) => api.table.columns.save({ key: colState.key, align })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="可排序">
      <a-switch
        :checked="typeof colState.sorter !== 'undefined'"
        @change="(sortable: boolean) => api.table.columns.save({ key: colState.key, sortable })"
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
        :value="colState.defaultSortOrder"
        @change="(defaultSort: string) => api.table.columns.save({ key: colState.key, defaultSort })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Column from '@/types/column'
import { defineComponent, reactive } from 'vue'
import { mdlAPI as api } from '@/apis'

export default defineComponent({
  name: 'TableProps',
  props: {
    column: { type: Column, required: true }
  },
  setup(props) {
    const colState = reactive(props.column)
    return {
      api,
      colState
    }
  }
})
</script>
