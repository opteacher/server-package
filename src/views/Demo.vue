<template>
  <LytDesign :active="`project/${pid}/model/${mid}/demo`">
    <div class="w-full text-right">
      <a-switch
        v-model:checked="useRealData"
        checked-children="真实"
        un-checked-children="模板"
        @change="onRefresh"
      />
      &nbsp;数据
    </div>
    <a-divider />
    <div class="mb-2.5 flex justify-between">
      <a-space>
        <h3 class="mb-0">{{ table.title }}</h3>
        <span class="text-gray-400">{{ table.desc }}</span>
      </a-space>
      <a-button type="primary" @click="formDialog.emitter.emit('update:show', { show: true })">
        添加
      </a-button>
    </div>
    <RefreshBox
      v-if="table.refresh.length"
      class="mb-2.5"
      :tblRfsh="table.refresh"
      @click="onRefresh"
    />
    <a-table
      :columns="columns"
      :data-source="records"
      :size="table.size"
      :scroll="{ y: 300 }"
      :rowClassName="() => 'bg-white'"
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
              @click.stop="formDialog.emitter.emit('update:show', { show: true, record })"
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
              @click.stop="formDialog.emitter.emit('update:show', { show: true, record })"
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
              <a class="text-error" @click.stop="(e: any) => e.preventDefault()">删除</a>
            </a-popconfirm>
          </template>
        </template>
        <CellCard
          v-else
          :cell="getCell(column.dataIndex, record)"
          :text="(text || '').toString()"
          :record="record"
        />
      </template>
      <template v-if="table.expandURL" #expandedRowRender="{ record }">
        <iframe
          class="w-full"
          :style="{ height: table.expHeight !== -1 ? table.expHeight + 'px' : 'auto' }"
          :src="fmtStrByObj(/\s?@.+?(?=\s)/g, record, table.expandURL)"
        />
      </template>
      <template #expandIcon="{ record }">
        <a-button @click.stop="onRowExpand(record)" class="w-5 h-5 text-xl py-0 px-1.5">
          <template v-if="expRowKeys.includes(record.key)">-</template>
          <template v-else>+</template>
        </a-button>
      </template>
    </a-table>
    <FormDialog
      :title="form.title"
      :copy="copyRecord"
      :width="`${form.width}vw`"
      v-model:show="formDialog.visible"
      :emitter="formDialog.emitter"
      :mapper="formDialog.mapper"
    />
  </LytDesign>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Column from '@lib/types/column'
import { pickOrIgnore, endsWith, fmtStrByObj } from '@/utils'
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import Table, { Cells } from '@/types/table'
import Model from '@/types/model'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import LytDesign from '../layouts/LytDesign.vue'
import RefreshBox from '../components/table/RefreshBox.vue'
import CellCard from '../components/table/CellCard.vue'
import Cell from '@/types/cell'
import Form from '@/types/form'
import Field from '@lib/types/field'
import { BaseTypes } from '@/types'
import dayjs, { Dayjs } from 'dayjs'
import { createByFields } from '@lib/types/mapper'

export default defineComponent({
  name: 'Demo',
  components: {
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
    const form = computed(() => store.getters['model/form'] as Form)
    const fields = computed(() => store.getters['model/fields'] as Field[])
    const table = computed(() => store.getters['model/table'] as Table)
    const cells = computed(() => store.getters['model/cells'])
    const records = computed(() => store.getters['model/records'](useRealData.value))
    const useRealData = ref(false)
    const formDialog = reactive({
      visible: false,
      emitter: new Emitter(),
      mapper: {}
    })
    const expRowKeys = reactive([] as string[])

    onMounted(onRefresh)

    async function onRefresh() {
      await store.dispatch('model/refresh', { reqDataset: useRealData.value })
      formDialog.emitter.emit('update:mapper', createByFields(fields.value))
    }
    function onRecordSave(record: any, next: () => void) {
      console.log(record)
      next()
    }
    function onRecordDel(record: any) {
      console.log(record)
    }
    function onRecordClick(record: any) {
      formDialog.emitter.emit('viewOnly', true)
      formDialog.emitter.emit('update:show', { show: true, record })
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
    function copyRecord(src: any, tgt?: any, force = false) {
      const props = model.value.props
      tgt = tgt || Object.fromEntries(props.map(prop => [prop.name, toDefault(prop.ptype)]))
      tgt.key = force ? src.key || src._id || src.id : src.key || src._id || src.id || tgt.key
      for (const prop of props) {
        switch (prop.ptype) {
          case 'Boolean':
            tgt[prop.name] = force
              ? src[prop.name]
              : typeof src[prop.name] !== 'undefined'
              ? src[prop.name]
              : tgt[prop.name]
            break
          case 'DateTime':
            tgt[prop.name] = src[prop.name]
              ? dayjs(src[prop.name])
              : force
              ? dayjs()
              : tgt[prop.name]
            break
          case 'Array':
            tgt[prop.name] =
              src[prop.name] && src[prop.name].length ? src[prop.name] : force ? [] : tgt[prop.name]
            break
          default:
            tgt[prop.name] = force ? src[prop.name] : src[prop.name] || tgt[prop.name]
        }
      }
      return tgt
    }
    function toDefault(type: BaseTypes) {
      switch (type) {
        case 'String':
        case 'LongStr':
          return ''
        case 'Number':
          return 0
        case 'DateTime':
          return ref<Dayjs>()
        case 'Boolean':
          return false
        case 'Array':
          return []
        case 'Object':
          return {}
        case 'Any':
        case 'Unknown':
          return undefined
      }
    }
    return {
      pid,
      mid,
      router,
      model,
      columns,
      form,
      table,
      cells,
      records,
      useRealData,
      formDialog,
      expRowKeys,

      onRefresh,
      endsWith,
      onRecordSave,
      onRecordDel,
      onRecordClick,
      getCell,
      onRowExpand,
      fmtStrByObj,
      copyRecord
    }
  }
})
</script>
