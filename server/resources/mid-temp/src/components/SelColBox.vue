<template>
  <a-button @click="selColsVsb = true">
    <template #icon>
      <insert-row-above-outlined />
    </template>
    显示列
  </a-button>
  <a-modal v-model:visible="selColsVsb" title="选择显示的列" width="50vw" :footer="null">
    <a-checkbox :checked="allSelCols" :indeterminate="indSelCols" @change="onAllColsChange">
      批量选择显示的列
    </a-checkbox>
    <a-checkbox-group
      :value="cols.filter((column: Column) => !column.notDisplay).map((column: Column) => column.key)"
      :options="cols.map((column: Column) => ({ label: column.title, value: column.key }))"
      @change="onDspColSelect"
    />
  </a-modal>
</template>

<script lang="ts">
import Column from '@lib/types/column'
import { defineComponent, reactive, ref, watch } from 'vue'
import { InsertRowAboveOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'SelColBox',
  components: {
    InsertRowAboveOutlined
  },
  emits: ['update:columns'],
  props: {
    columns: { type: Array, required: true }
  },
  setup(props, { emit }) {
    const cols = reactive(props.columns as Column[])
    const selColsVsb = ref(false)
    const allSelCols = ref(
      cols.reduce((prev: boolean, column: Column) => prev && !column.notDisplay, true)
    )
    const indSelCols = ref(
      cols.reduce((prev: boolean, column: Column) => prev || column.notDisplay, false)
    )

    watch(
      () => props.columns,
      () => {
        cols.splice(0, cols.length, ...(props.columns as Column[]))
      }
    )

    function onAllColsChange(e: { target: { checked: boolean } }) {
      cols.map((column: Column) => {
        column.notDisplay = !e.target.checked
      })
      allSelCols.value = e.target.checked
      indSelCols.value = false
      emit('update:columns', cols)
    }
    function onDspColSelect(chkVals: string[]) {
      cols.map((column: Column) => {
        column.notDisplay = !chkVals.includes(column.key)
      })
      indSelCols.value = cols.reduce(
        (prev: boolean, column: Column) => prev || column.notDisplay,
        false
      )
      emit('update:columns', cols)
    }
    return {
      Column,

      cols,
      selColsVsb,
      allSelCols,
      indSelCols,

      onAllColsChange,
      onDspColSelect
    }
  }
})
</script>
