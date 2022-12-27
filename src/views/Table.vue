<template>
  <LytDesign :active="`project/${pid}/model/${mid}/table`">
    <a-layout class="h-full">
      <a-layout-content class="main-panel" @click="selected = ''">
        <div class="bg-white p-2.5">
          <a-row class="mb-2.5" type="flex">
            <a-col flex="auto">
              <a-space>
                <h3 class="mb-0">{{ table.title }}</h3>
                <span class="text-gray-400">{{ table.desc }}</span>
              </a-space>
            </a-col>
            <a-col class="text-right" flex="200px">
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
            </a-col>
          </a-row>
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
              <span :style="{ color: selected === `head_${column.key}` ? '#1890ff' : '#000000d9' }">
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
                <template v-else>
                  <a v-if="table.operable.includes('可编辑')" class="mr-5">编辑</a>
                  <a v-if="table.operable.includes('可删除')" style="color: #ff4d4f">删除</a>
                </template>
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
      <a-layout-sider width="30%" class="bg-white p-20 overflow-y-auto">
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
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import LytDesign from '../layouts/LytDesign.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import DemoForm from '../components/form/DemoForm.vue'
import Column from '@/types/column'
import Table, { Cells } from '@/types/table'
import { pickOrIgnore, endsWith } from '@/utils'
import TableProps from '../components/table/TableProps.vue'
import ColumnProps from '../components/table/ColumnProps.vue'
import CellProps from '../components/table/CellProps.vue'
import { mdlAPI as api } from '../apis'
import { useRoute } from 'vue-router'
import { dispHidCol } from './Table'
import RefreshBox from '../components/table/RefreshBox.vue'
import CellCard from '../components/table/CellCard.vue'
import Cell from '@/types/cell'
import SelColBox from '../components/table/SelColBox.vue'
import BchExpBox from '../components/table/BchExpBox.vue'
import BchImpBox from '../components/table/BchImpBox.vue'

export default defineComponent({
  name: 'Table',
  components: {
    LytDesign,
    DemoForm,
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
    const records = computed(() => store.getters['model/records'](false))
    const fmEmitter = new Emitter()
    const selected = ref('')
    const table = computed(() => store.getters['model/table'] as Table)
    const cells = computed(() => store.getters['model/cells'])
    const selColumn = reactive(new Column('', ''))
    const selCname = ref('')
    const selCell = reactive(new Cells())

    onMounted(() => store.dispatch('model/refresh'))
    watch(() => selected.value, onSelChange)

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
      cells,
      records,
      selected,
      selColumn,
      selCell,
      selCname,
      fmEmitter,

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
