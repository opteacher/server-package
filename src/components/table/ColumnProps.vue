<template>
  <a-descriptions class="mb-50" title="列" :column="1" bordered size="small">
    <a-descriptions-item label="是否显示">
      <a-switch
        :checked="!colState.notDisplay"
        @change="(display: boolean) => onPropChange({ key: colState.key, notDisplay: !display })"
        checked-children="显示"
        un-checked-children="不显示"
      />
    </a-descriptions-item>
    <a-descriptions-item label="标题">
      <a-input
        v-model:value="colState.title"
        @blur="
          (e: any) =>
            onPropChange({
              key: colState.key,
              title: e.target.value
            })
        "
      />
    </a-descriptions-item>
    <a-descriptions-item label="宽度">
      <a-input-number
        class="w-full"
        v-model:value="colState.width"
        @blur="(width: number) => onPropChange({ key: colState.key, width })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="对齐">
      <a-select
        class="w-full"
        :options="[
          { label: '左对齐', value: 'left' },
          { label: '居中对齐', value: 'center' },
          { label: '右对齐', value: 'right' }
        ]"
        :value="colState.align || 'left'"
        @change="(align: string) => onPropChange({ key: colState.key, align })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="可排序">
      <a-switch
        :checked="typeof colState.sorter !== 'undefined'"
        @change="(sortable: boolean) => onPropChange({ key: colState.key, sortable })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="默认顺序">
      <a-select
        class="w-full"
        :options="[
          { label: '无', value: '' },
          { label: '升序', value: 'ascend' },
          { label: '降序', value: 'descend' }
        ]"
        :value="colState.defaultSortOrder"
        @change="(defaultSort: string) => onPropChange({ key: colState.key, defaultSort })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Column from '@lib/types/column'
import { defineComponent, reactive } from 'vue'
import { mdlAPI as api } from '@/apis'

export default defineComponent({
  name: 'TableProps',
  emits: ['change'],
  props: {
    column: { type: Column, required: true }
  },
  setup(props, { emit }) {
    const colState = reactive(props.column)

    async function onPropChange(prop: any) {
      await api.table.columns.save(prop)
      emit('change')
    }
    return {
      colState,

      onPropChange
    }
  }
})
</script>
