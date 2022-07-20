<template>
  <a-descriptions class="mb-50" title="项" :column="1" bordered size="small">
    <a-descriptions-item label="颜色">
      <ColorField :color="cell.color" @submit="onColorSubmit" />
    </a-descriptions-item>
    <a-descriptions-item label="前缀">
      <a-input
        v-model:value="edtCell.prefix"
        @blur="(e: any) => api.table.cells.save({ [pname]: Object.assign(edtCell, { prefix: e.target.value }) })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="后缀">
      <a-input
        v-model:value="edtCell.suffix"
        @blur="(e: any) => api.table.cells.save({ [pname]: Object.assign(edtCell, { suffix: e.target.value }) })"
      />
    </a-descriptions-item>
    <!-- <a-descriptions-item label="格式化时间">
      <a-row class="mb-5" :gutter="4">
        <a-col :span="8">
          <a-select
            class="w-100"
            placeholder="年份"
            :labelInValue="true"
            :options="['YYYY', 'YY']"
          />
        </a-col>
        <a-col :span="8">
          <a-select class="w-100" placeholder="月份" :labelInValue="true" :options="['MM', 'M']" />
        </a-col>
        <a-col :span="8">
          <a-select class="w-100" placeholder="日" :labelInValue="true" :options="['DD', 'D']" />
        </a-col>
      </a-row>
      <a-row :gutter="4">
        <a-col :span="8">
          <a-select class="w-100" placeholder="小时" />
        </a-col>
        <a-col :span="8">
          <a-select class="w-100" placeholder="分钟" />
        </a-col>
        <a-col :span="8">
          <a-select class="w-100" placeholder="秒" />
        </a-col>
      </a-row>
    </a-descriptions-item> -->
  </a-descriptions>
</template>

<script lang="ts">
import Cell from '@/types/cell'
import { defineComponent, reactive } from 'vue'
import ColorField from '@/components/table/ColorField.vue'
import { mdlAPI as api } from '@/apis'

export default defineComponent({
  name: 'TableProps',
  emits: ['change'],
  components: {
    ColorField
  },
  props: {
    pname: { type: String, required: true },
    cell: { type: Cell, required: true }
  },
  setup(props) {
    const edtCell = reactive(props.cell)

    async function onColorSubmit({ color, next }: { color: string; next: () => void }) {
      await api.table.cells.save({ [props.pname]: Object.assign(edtCell, { color }) })
      next()
    }
    return {
      api,
      edtCell,

      onColorSubmit
    }
  }
})
</script>
