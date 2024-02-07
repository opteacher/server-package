<template>
  <a-descriptions class="mb-50" title="列" :column="1" bordered size="small">
    <a-descriptions-item label="是否显示">
      <a-switch
        :checked="!column.notDisplay"
        @change="(display: boolean) => onPropChange({ key: column.key, notDisplay: !display })"
        checked-children="显示"
        un-checked-children="不显示"
      />
    </a-descriptions-item>
    <a-descriptions-item label="标题">
      <a-input
        :value="column.title"
        @blur="
          (e: any) =>
            onPropChange({
              key: column.key,
              title: e.target.value
            })
        "
      />
    </a-descriptions-item>
    <a-descriptions-item label="宽度">
      <a-input-number
        class="w-full"
        :value="column.width"
        @blur="(width: number) => onPropChange({ key: column.key, width })"
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
        :value="column.align || 'left'"
        @change="(align: string) => onPropChange({ key: column.key, align })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="可排序">
      <a-switch
        :checked="typeof column.sorter !== 'undefined'"
        @change="(sortable: boolean) => onPropChange({ key: column.key, sortable })"
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
        :value="column.defaultSortOrder"
        @change="(defaultSort: string) => onPropChange({ key: column.key, defaultSort })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="组">
      <a-input
        class="h-full"
        :value="column.group ? column.group[0] : ''"
        @blur="(e: any) => onPropChange({
          key: column.key, group: e.target.value ? [e.target.value] : []
        })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts" setup name="TableProps">
import { mdlAPI as api } from '@/apis'
import Column from '@lib/types/column'

const emit = defineEmits(['change'])
defineProps({
  column: { type: Column, required: true }
})

async function onPropChange(prop: any) {
  await api.table.columns.save(prop)
  emit('change')
}
</script>
