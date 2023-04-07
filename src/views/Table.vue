<template>
  <LytDesign :active="`project/${pid}/model/${mid}/table`">
    <a-layout class="h-full">
      <a-layout-content class="p-5" width="70%" @click="selected = ''">
        <div class="bg-white p-2.5">
          <div class="mb-2.5 flex justify-between">
            <a-space>
              <h3 class="mb-0">{{ table.title }}</h3>
              <span class="text-gray-400">{{ table.desc }}</span>
            </a-space>
            <a-space>
              <SelColBox v-if="table.colDspable" v-model:columns="columns" />
              <a-space v-if="table.operable.includes('可增加')">
                <BchExpBox
                  v-if="table.imExport.includes('export')"
                  :columns="columns"
                  :copyFun="() => undefined"
                />
                <BchImpBox
                  v-if="table.imExport.includes('import')"
                  :columns="columns"
                  :copyFun="() => undefined"
                />
                <a-button type="primary">添加</a-button>
              </a-space>
            </a-space>
          </div>
          <RefreshBox v-if="table.refresh.length" class="mb-2.5" :tblRfsh="table.refresh" />
          <a-table
            class="demo-table"
            :columns="columns"
            :data-source="records"
            :size="table.size"
            :rowClassName="() => 'bg-white'"
            :pagination="table.hasPages ? { pageSize: table.maxPerPgs } : false"
            bordered
          >
            <template #headerCell="{ title, column }">
              <span
                :style="{
                  color: selected === `head_${column.key}` ? '@primary-color' : '#000000d9'
                }"
              >
                {{ title }}
              </span>
            </template>
            <template #bodyCell="{ text, column, record }">
              <template v-if="column.dataIndex === 'opera'">
                <template v-if="table.operaStyle === 'button'">
                  <a-button v-if="table.operable.includes('可编辑')" size="small" class="mb-5">
                    编辑
                  </a-button>
                  <a-button v-if="table.operable.includes('可删除')" size="small" danger>
                    删除
                  </a-button>
                </template>
                <div v-else class="space-x-1.5">
                  <a v-if="table.operable.includes('可编辑')">编辑</a>
                  <a v-if="table.operable.includes('可删除')" class="text-error">删除</a>
                </div>
              </template>
              <CellCard
                v-else
                :cell="getCell(column.dataIndex)"
                :text="(text || '').toString()"
                :selected="selected === `cell_${column.dataIndex}`"
                :record="record"
              />
            </template>
            <template v-if="table.expandURL" #expandedRowRender />
            <template #emptyText>
              <a-empty>
                <template #description>未查询到数据</template>
                <a-button type="primary" @click.stop="emitter.emit('update:show', true)">
                  点击创建一条演示记录
                </a-button>
                <FormDialog
                  :title="form.title"
                  :with="`${form.width}vw`"
                  :labelWidth="form.labelWidth"
                  :copy="copy"
                  :mapper="mapper"
                  :emitter="emitter"
                  @submit="onFormSubmit"
                />
              </a-empty>
            </template>
          </a-table>
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

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Cell from '@/types/cell'
import Form from '@/types/form'
import Table, { Cells } from '@/types/table'
import { endsWith, pickOrIgnore } from '@/utils'
import { bsTpDefault } from '@lib/types'
import Column from '@lib/types/column'
import Field from '@lib/types/field'
import { createByFields } from '@lib/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { mdlAPI as api } from '../apis'
import BchExpBox from '../components/table/BchExpBox.vue'
import BchImpBox from '../components/table/BchImpBox.vue'
import CellCard from '../components/table/CellCard.vue'
import CellProps from '../components/table/CellProps.vue'
import ColumnProps from '../components/table/ColumnProps.vue'
import RefreshBox from '../components/table/RefreshBox.vue'
import SelColBox from '../components/table/SelColBox.vue'
import TableProps from '../components/table/TableProps.vue'
import LytDesign from '../layouts/LytDesign.vue'
import { dispHidCol } from './Table'

export default defineComponent({
  name: 'Table',
  components: {
    LytDesign,
    TableProps,
    ColumnProps,
    CellProps,
    CellCard,
    RefreshBox,
    SelColBox,
    BchExpBox,
    BchImpBox
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const mid = route.params.mid
    const hdHeight = ref(0)
    const mdlProps = computed(() =>
      store.getters['model/ins'].props.map((prop: any) => ({ label: prop.label, value: prop.name }))
    )
    const columns = computed(() => {
      const ret = store.getters['model/columns']
        .map((column: Column) =>
          Object.assign(
            {
              customHeaderCell: () => ({
                onClick: (e: PointerEvent) => onHdCellClick(e, column.key)
              }),
              customCell: () => ({
                onClick: (e: PointerEvent) => onCellClick(e, column.dataIndex)
              })
            },
            pickOrIgnore(column, ['slots'])
          )
        )
        .filter((column: Column) => !column.notDisplay || dispHidCol.value)
      const table = store.getters['model/table'] as Table
      if (table.operable.includes('可编辑') || table.operable.includes('可删除')) {
        return ret.concat(
          pickOrIgnore(new Column('操作', 'opera', { key: 'opera', width: 100 }), ['slots'])
        ) as Column[]
      } else {
        return ret as Column[]
      }
    })
    const mapper = computed(() => createByFields(store.getters['model/fields']))
    const copy = computed(
      () => () =>
        Object.fromEntries(
          store.getters['model/fields'].map((field: Field) => [
            field.refer,
            field.default || bsTpDefault(field.vtype)
          ])
        )
    )
    const form = computed(() => store.getters['model/form'] as Form)
    const records = computed(() => store.getters['model/records'](false))
    const emitter = new Emitter()
    const selected = ref('')
    const table = computed(() => store.getters['model/table'] as Table)
    const cells = computed(() => store.getters['model/cells'])
    const selColumn = reactive(new Column('', ''))
    const selCname = ref('')
    const selCell = reactive(new Cells())

    onMounted(refresh)
    watch(() => selected.value, onSelChange)

    async function refresh() {
      await store.dispatch('model/refresh')
      emitter.emit('update:mapper', createByFields(store.getters['model/fields']))
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
    function onSelChange() {
      if (selected.value.startsWith('head_')) {
        Column.copy(
          columns.value.find(
            (column: any) => column.key === selected.value.substring('head_'.length)
          ),
          selColumn
        )
      } else if (selected.value.startsWith('cell_')) {
        selCname.value = selected.value.substring('cell_'.length)
        Cells.copy(
          table.value.cells.find((cell: any) => cell.refer === selCname.value) || new Cells(),
          selCell,
          true
        )
      } else {
        selColumn.reset()
        const selCond = selCell.selCond
        selCell.reset()
        selCell.selCond = selCond
      }
    }
    function getCell(refProp: string): Cell {
      let ret = cells.value.find((cell: any) => cell.refer === refProp)
      if (ret.selCond) {
        ret = ret.cdCell[ret.selCond]
      }
      return ret
    }
    function onCondUpdate(cond: string) {
      store.commit('model/SET_CELL_COND', { refer: selCname.value, cond })
    }
    return {
      store,
      pid,
      mid,
      table,
      hdHeight,
      mdlProps,
      columns,
      mapper,
      copy,
      form,
      cells,
      records,
      selected,
      selColumn,
      selCell,
      selCname,
      emitter,

      onFormSubmit,
      endsWith,
      onSelChange,
      getCell,
      onCondUpdate
    }
  }
})
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
