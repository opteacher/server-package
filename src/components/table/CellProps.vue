<template>
  <a-descriptions class="mb-50" title="项" :column="1" bordered size="small">
    <a-descriptions-item label="颜色">
      <ColorField
        :color="cell.color"
        @submit="
          ({ color, next }) => {
            api.table.cells.save({ key: cell.key, color }).then(next)
          }
        "
      />
    </a-descriptions-item>
    <a-descriptions-item label="前缀">
      <a-input
        :value="cell.prefix"
        @change="e => api.table.cells.save({ key: cell.key, prefix: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="后缀">
      <a-input
        :value="cell.suffix"
        @change="e => api.table.cells.save({ key: cell.key, suffix: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="格式化时间">
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
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Cell from '@/types/cell'
import { defineComponent } from 'vue'
import ColorField from '@/components/table/ColorField.vue'
import { mdlAPI as api } from '@/apis'

export default defineComponent({
  name: 'TableProps',
  components: {
    ColorField
  },
  props: {
    cell: { type: Cell, required: true }
  },
  setup() {
    return {
      api
    }
  }
})
</script>
