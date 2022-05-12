<template>
  <LytDesign @change:height="height => (hdHeight = height)">
    <div class="table-container" :style="{ top: `${40 + hdHeight}px` }">
      <a-layout class="h-100">
        <a-layout-content class="main-panel" @click="selected = ''">
          <div class="white-bkgd p-10">
            <a-row class="mb-10" type="flex">
              <a-col flex="auto">
                <a-space>
                  <h3 class="mb-0">{{ table.title }}</h3>
                  <span style="color: rgba(0, 0, 0, 0.45)">{{ table.desc }}</span>
                </a-space>
              </a-col>
              <a-col v-if="table.operable.includes('可增加')" flex="100px">
                <a-button class="float-right" type="primary">添加</a-button>
              </a-col>
            </a-row>
            <a-table
              class="demo-table"
              :columns="columns"
              :data-source="records"
              :size="table.size"
              :rowClassName="() => 'white-bkgd'"
              :pagination="table.hasPages"
              bordered
            >
              <template #headerCell="{ title, column }">
                <span
                  :style="{ color: selected === `head_${column.key}` ? '#1890ff' : '#000000d9' }"
                >
                  {{ title }}
                </span>
              </template>
              <template #bodyCell="{ text, column }">
                <template v-if="column.dataIndex === 'opera'">
                  <template v-if="table.operaStyle === 'button'">
                    <a-button v-if="table.operable.includes('可编辑')" size="small" class="mb-5">
                      编辑
                    </a-button>
                    <a-button v-if="table.operable.includes('可删除')" size="small" danger>
                      删除
                    </a-button>
                  </template>
                  <template v-else>
                    <a v-if="table.operable.includes('可编辑')" class="mr-5">编辑</a>
                    <a v-if="table.operable.includes('可删除')" style="color: #ff4d4f">删除</a>
                  </template>
                </template>
                <span
                  v-else
                  :style="{
                    color:
                      selected === `cell_${column.dataIndex}`
                        ? '#1890ff'
                        : cells[column.dataIndex].color
                  }"
                >
                  {{
                    cells[column.dataIndex].prefix &&
                    !text.startsWith(cells[column.dataIndex].prefix)
                      ? cells[column.dataIndex].prefix
                      : ''
                  }}{{ text
                  }}{{
                    cells[column.dataIndex].suffix &&
                    !endsWith(text, cells[column.dataIndex].suffix)
                      ? cells[column.dataIndex].suffix
                      : ''
                  }}
                </span>
              </template>
              <template #emptyText>
                <a-empty>
                  <template #description>未查询到数据</template>
                  <a-button
                    type="primary"
                    @click.stop="fmEmitter.emit('update:show', { show: true })"
                  >
                    点击创建一条演示记录
                  </a-button>
                  <DemoForm :emitter="fmEmitter" @submit="onFormSubmit" />
                </a-empty>
              </template>
            </a-table>
          </div>
        </a-layout-content>
        <a-layout-sider width="30%" class="white-bkgd p-20 vertical-scroll">
          <TableProps v-if="!selected" :table="table" />
          <ColumnProps v-else-if="selected.startsWith('head_')" :column="selColumn" />
          <CellProps v-else-if="selected.startsWith('cell')" :cell="selCell" />
        </a-layout-sider>
      </a-layout>
    </div>
  </LytDesign>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import LytDesign from '../layouts/LytDesign.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import DemoForm from '../components/DemoForm.vue'
import Column from '@/types/column'
import Table from '@/types/table'
import { skipIgnores, endsWith } from '@/utils'
import TableProps from '../components/TableProps.vue'
import ColumnProps from '../components/ColumnProps.vue'
import CellProps from '../components/CellProps.vue'
import Cell from '@/types/cell'
import { mdlAPI as api } from '../apis'

export default defineComponent({
  name: 'Table',
  components: {
    LytDesign,
    DemoForm,
    TableProps,
    ColumnProps,
    CellProps
  },
  setup() {
    const store = useStore()
    const hdHeight = ref(0)
    const columns = computed(() => {
      const ret = store.getters['model/columns'].map((column: Column) =>
        Object.assign(
          {
            customHeaderCell: () => ({
              onClick: (e: PointerEvent) => onHdCellClick(e, column.key)
            }),
            customCell: () => ({
              onClick: (e: PointerEvent) => onCellClick(e, column.dataIndex)
            })
          },
          skipIgnores(column, ['slots'])
        )
      )
      const table = store.getters['model/table'] as Table
      if (table.operable.includes('可编辑') || table.operable.includes('可删除')) {
        return ret.concat(
          skipIgnores(new Column('操作', 'opera', { key: 'opera', width: 100 }), ['slots'])
        ) as Column[]
      } else {
        return ret as Column[]
      }
    })
    const records = computed(() => store.getters['model/records'](false))
    const fmEmitter = new Emitter()
    const selected = ref('')
    const table = computed(() => store.getters['model/table'] as Table)
    const cells = computed(() => (store.getters['model/table'] as Table).cells)
    const selColumn = computed(() => {
      const key = selected.value.substring('head_'.length)
      return store.getters['model/columns'].find((column: any) => column.key === key)
    })
    const selCell = computed(() => {
      const key = selected.value.substring('cell_'.length)
      return Cell.copy({ key }, table.value.cells[key])
    })

    function onHdCellClick(e: PointerEvent, colKey: string) {
      selected.value = `head_${colKey}`
      e.stopPropagation()
    }
    function onCellClick(e: PointerEvent, cellKey: string) {
      selected.value = `cell_${cellKey}`
      e.stopPropagation()
    }
    async function onFormSubmit(formState: any, next: () => void) {
      await api.table.record.set(formState)
      next()
    }
    return {
      store,
      table,
      hdHeight,
      columns,
      cells,
      records,
      selected,
      selColumn,
      selCell,
      fmEmitter,

      onFormSubmit,
      endsWith
    }
  }
})
</script>

<style lang="less">
.main-panel {
  padding: 20px;
  width: 70%;
}

.table-container {
  position: fixed;
  bottom: 30px;
  left: 70px;
  right: 70px;
}

.demo-table {
  th:hover {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.04);
  }
  tbody {
    tr:hover:not(.ant-table-expanded-row) > td {
      background: inherit;
    }
    td:hover {
      cursor: pointer;
      background: #fafafa !important;
    }
  }
}
</style>
