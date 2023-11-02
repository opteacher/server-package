<template>
  <LytDesign :active="`/project/${pid}/model/${mid}/table`">
    <a-layout class="h-full">
      <a-layout-content class="p-5" width="70%" @click="selected = ''">
        <div class="bg-white p-2.5 h-full">
          <EditableTable
            class="demo-table"
            :api="{ all: () => records }"
            sclHeight="h-full"
            :columns="columns"
            :mapper="mapper"
            :copy="copy"
            :emitter="emitter"
            :size="table.size"
            :pagable="table.hasPages"
            :refOptions="table.refresh"
            :clkable="false"
            :dspCols="table.colDspable"
            :editable="table.operable.includes('可编辑')"
            :addable="table.operable.includes('可增加')"
            :delable="table.operable.includes('可删除')"
          />
        </div>
      </a-layout-content>
      <a-layout-sider width="30%" class="bg-white p-5 overflow-y-auto">
        <TableProps v-if="!selected" :table="table" />
        <ColumnProps
          v-else-if="selected.startsWith('head_')"
          :column="selColumn"
          @change="onSelChange"
        />
        <CellProps
          v-else-if="selected.startsWith('cell')"
          :pname="selCname"
          :props="mdlProps"
          :cells="selCell"
          @update:cond="onCondUpdate"
        />
      </a-layout-sider>
    </a-layout>
  </LytDesign>
</template>

<script lang="ts" setup name="Table">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Cell from '@/types/cell'
import Table, { Cells } from '@/types/table'
import { pickOrIgnore } from '@/utils'
import { bsTpDefault } from '@lib/types'
import Column from '@lib/types/column'
import Field from '@lib/types/field'
import Mapper, { createByFields } from '@lib/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'

import { mdlAPI as api } from '../apis'
import CellProps from '../components/table/CellProps.vue'
import ColumnProps from '../components/table/ColumnProps.vue'
import TableProps from '../components/table/TableProps.vue'
import LytDesign from '../layouts/LytDesign.vue'
import { dispHidCol } from './Table'
import { useRoute } from 'vue-router'

const store = useStore()
const route = useRoute()
const pid = route.params.pid
const mid = route.params.mid
const mdlProps = computed<{ label: string; value: string }[]>(() =>
  store.getters['model/ins'].props.map((prop: any) => ({ label: prop.label, value: prop.name }))
)
const columns = ref<Column[]>([])
const mapper = ref<Mapper>(new Mapper())
const copy = ref<() => any>(() => ({}))
const records = computed(() => store.getters['model/records'](false))
const emitter = new Emitter()
const selected = ref<string>('')
const table = computed<Table>(() => store.getters['model/table'])
const cells = computed<Cells[]>(() => store.getters['model/cells'])
const selColumn = ref<Column>(new Column('', ''))
const selCname = ref<string>('')
const selCell = ref<Cells>(new Cells())

onMounted(refresh)
watch(() => selected.value, onSelChange)

async function refresh() {
  await store.dispatch('model/refresh')
  copy.value = () =>
    Object.fromEntries(
      store.getters['model/fields'].map((field: Field) => [
        field.refer,
        field.default || bsTpDefault(field.vtype)
      ])
    )
  columns.value.splice(
    0,
    columns.value.length,
    ...store.getters['model/columns']
      .filter((column: Column) => !column.notDisplay || dispHidCol.value)
      .map((column: Column) => ({
        ...pickOrIgnore(column, ['slots']),
        custHdCell: {
          onClick: (e: PointerEvent) => onHdCellClick(e, column.key)
        },
        custCell: {
          onClick: (e: PointerEvent) => onCellClick(e, column.dataIndex)
        }
      }))
  )
  mapper.value = createByFields(store.getters['model/fields'])
  emitter.emit('refresh')
}
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
async function onSelChange() {
  if (selected.value.startsWith('head_')) {
    selColumn.value =
      columns.value.find(
        (column: any) => column.key === selected.value.substring('head_'.length)
      ) || new Column('', '')
  } else if (selected.value.startsWith('cell_')) {
    selCname.value = selected.value.substring('cell_'.length)
    selCell.value =
      table.value.cells.find((cell: any) => cell.refer === selCname.value) || new Cells()
  } else {
    selColumn.value.reset()
    const selCond = selCell.value.selCond
    selCell.value.reset()
    selCell.value.selCond = selCond
  }
  await refresh()
}
function getCell(refProp: string): Cell {
  let ret = cells.value.find((cell: any) => cell.refer === refProp)
  if (ret?.selCond) {
    return ret.cdCell[ret.selCond]
  }
  return ret as Cell
}
function onCondUpdate(cond: string) {
  store.commit('model/SET_CELL_COND', { refer: selCname.value, cond })
  emitter.emit('refresh')
}
</script>

<style lang="less">
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
