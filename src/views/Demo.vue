<template>
  <LytDesign :active="`project/${pid}/model/${mid}/demo`">
    <div class="w-100 text-right">
      <a-switch
        v-model:checked="useRealData"
        checked-children="真实"
        un-checked-children="模板"
        @change="onRefresh"
      />
      &nbsp;数据
    </div>
    <a-divider />
    <a-row class="mb-10" type="flex">
      <a-col flex="auto">
        <a-space>
          <h3 class="mb-0">{{ table.title }}</h3>
          <span style="color: rgba(0, 0, 0, 0.45)">{{ table.desc }}</span>
        </a-space>
      </a-col>
      <a-col v-if="table.operable.includes('可增加')" flex="100px">
        <a-button
          class="float-right"
          type="primary"
          @click="fmEmitter.emit('update:show', { show: true })"
        >
          添加
        </a-button>
      </a-col>
    </a-row>
    <RefreshBox
      v-if="table.refresh.length"
      class="mb-10"
      :tblRfsh="table.refresh"
      @click="onRefresh"
    />
    <a-table
      :columns="columns"
      :data-source="records"
      :size="table.size"
      :scroll="{ y: 300 }"
      :rowClassName="() => 'white-bkgd'"
      :expandedRowKeys="expRowKeys"
      :pagination="table.hasPages ? { pageSize: table.maxPerPgs } : false"
      bordered
      :custom-row="
        (record: any) => ({
          onClick: () => onRecordClick(record)
        })
      "
    >
      <template #bodyCell="{ text, column, record }">
        <template v-if="column.dataIndex === 'opera'">
          <template v-if="table.operaStyle === 'button'">
            <a-button
              v-if="table.operable.includes('可编辑')"
              size="small"
              class="mb-5"
              @click="fmEmitter.emit('update:show', { show: true, record })"
            >
              编辑
            </a-button>
            <a-popconfirm
              v-if="table.operable.includes('可删除')"
              title="确定删除该记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="onRecordDel(record)"
            >
              <a-button size="small" danger @click.stop="(e: any) => e.preventDefault()">
                删除
              </a-button>
            </a-popconfirm>
          </template>
          <template v-else>
            <a
              v-if="table.operable.includes('可编辑')"
              class="mr-5"
              @click="fmEmitter.emit('update:show', { show: true, record })"
            >
              编辑
            </a>
            <a-popconfirm
              v-if="table.operable.includes('可删除')"
              title="确定删除该记录吗？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="onRecordDel(record)"
            >
              <a style="color: #ff4d4f">删除</a>
            </a-popconfirm>
          </template>
        </template>
        <CellCard
          v-else
          :cell="getCell(column.dataIndex, record)"
          :text="(text || '').toString()"
        />
      </template>
      <template v-if="table.expandURL" #expandedRowRender="{ record }">
        <iframe class="w-100 h-100" :src="genExpURL(record)" />
      </template>
      <template #expandIcon="{ record }">
        <a-button
          @click.stop="onRowExpand(record)"
          :style="{ width: '20px', height: '20px', 'font-size': '10px', padding: '0 5px' }"
        >
          <template v-if="expRowKeys.includes(record.key)">-</template>
          <template v-else>+</template>
        </a-button>
      </template>
    </a-table>
    <DemoForm :emitter="fmEmitter" @submit="onRecordSave" />
  </LytDesign>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Column from '@/types/column'
import { pickOrIgnore, endsWith, getProperty } from '@/utils'
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import Table, { Cells } from '@/types/table'
import Model from '@/types/model'
import DemoForm from '../components/form/DemoForm.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import LytDesign from '../layouts/LytDesign.vue'
import RefreshBox from '../components/table/RefreshBox.vue'
import CellCard from '../components/table/CellCard.vue'
import Cell from '@/types/cell'

export default defineComponent({
  name: 'Demo',
  components: {
    DemoForm,
    LytDesign,
    RefreshBox,
    CellCard
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const pid = route.params.pid
    const mid = route.params.mid
    const model = computed(() => store.getters['model/ins'] as Model)
    const columns = computed(() => {
      const ret = store.getters['model/columns']
        .map((column: Column) => pickOrIgnore(column, ['slots']))
        .filter((column: Column) => !column.notDisplay)
      const table = store.getters['model/table'] as Table
      if (table.operable.includes('可编辑') || table.operable.includes('可删除')) {
        return ret.concat(
          pickOrIgnore(new Column('操作', 'opera', { key: 'opera', width: 100 }), ['slots'])
        ) as Column[]
      } else {
        return ret as Column[]
      }
    })
    const table = computed(() => store.getters['model/table'] as Table)
    const cells = computed(() => store.getters['model/cells'])
    const records = computed(() => store.getters['model/records'](useRealData.value))
    const useRealData = ref(false)
    const fmEmitter = new Emitter()
    const expRowKeys = reactive([] as string[])

    onMounted(onRefresh)

    function onRefresh() {
      store.dispatch('model/refresh', { reqDataset: useRealData.value })
    }
    function onRecordSave(record: any, next: () => void) {
      console.log(record)
      next()
    }
    function onRecordDel(record: any) {
      console.log(record)
    }
    function onRecordClick(record: any) {
      fmEmitter.emit('viewOnly', true)
      fmEmitter.emit('update:show', { show: true, record })
    }
    function getCell(refProp: string, record: any): Cell {
      let ret = cells.value.find((cell: any) => cell.refer === refProp) as Cells
      if (ret.cdCell) {
        for (const [cond, cell] of Object.entries(ret.cdCell)) {
          const conds = cond.split('_')
          const prop = conds[0]
          const cmp = conds[1]
          const tgtVal = conds[2]
          const srcVal = record[prop]
          switch (cmp) {
            case '=':
              if (srcVal == tgtVal) {
                return cell
              }
              break
            case '!=':
              if (srcVal != tgtVal) {
                return cell
              }
              break
            case '>':
              if (srcVal > tgtVal) {
                return cell
              }
              break
            case '>=':
              if (srcVal >= tgtVal) {
                return cell
              }
              break
            case '<':
              if (srcVal < tgtVal) {
                return cell
              }
              break
            case '<=':
              if (srcVal <= tgtVal) {
                return cell
              }
              break
          }
        }
      }
      return ret
    }
    function onRowExpand(record: { key: string }) {
      if (expRowKeys.includes(record.key)) {
        expRowKeys.splice(expRowKeys.indexOf(record.key), 1)
      } else {
        expRowKeys.push(record.key)
      }
    }
    function genExpURL(record: any): string {
      const pattern = /\^.+?(?=\$)/g
      let expURL = table.value.expandURL
      for (
        let result = pattern.exec(table.value.expandURL);
        result;
        result = pattern.exec(table.value.expandURL)
      ) {
        expURL = expURL.replace(result[0] + '$', getProperty(record, result[0].substring(1)))
      }
      console.log(expURL)
      return expURL
    }
    return {
      pid,
      mid,
      router,
      model,
      columns,
      table,
      cells,
      records,
      useRealData,
      fmEmitter,
      expRowKeys,

      onRefresh,
      endsWith,
      onRecordSave,
      onRecordDel,
      onRecordClick,
      getCell,
      onRowExpand,
      genExpURL
    }
  }
})
</script>
