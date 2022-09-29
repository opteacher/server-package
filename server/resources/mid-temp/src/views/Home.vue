<template>
  <IndexLayout ref="layout" @change="onMuItmChange">
    <a-row class="mb-10" type="flex">
      <a-col flex="auto">
        <a-space>
          <h3 class="mb-0">{{ table.title }}</h3>
          <span style="color: rgba(0, 0, 0, 0.45)">{{ table.desc }}</span>
        </a-space>
      </a-col>
      <a-col v-if="table.operable.includes('可增加')" style="text-align: right" flex="200px">
        <a-space>
          <SelColBox v-if="table.colDspable" v-model:columns="columns" />
          <a-space v-if="table.operable.includes('可增加')">
            <BchExpBox
              v-if="table.imExport.includes('export')"
              :columns="columns"
              :copyFun="bchEptCopy"
            />
            <BchImpBox
              v-if="table.imExport.includes('import')"
              :columns="columns"
              :copyFun="bchIptCopy"
            />
            <a-button
              type="primary"
              @click="
                fmEmitter.emit('update:show', {
                  show: true,
                  cpyRcd: (tgt: any) => actCopy(actCopy({}), tgt, true)
                })
              "
            >
              添加
            </a-button>
          </a-space>
        </a-space>
      </a-col>
    </a-row>
    <RefreshBox
      v-if="table.refresh.length"
      class="mb-10"
      :tblRfsh="table.refresh"
      @click="refresh"
    />
    <a-table
      :columns="columns"
      :data-source="records"
      :size="table.size"
      :scroll="{ y: ctnrHeight }"
      :rowClassName="() => 'white-bkgd'"
      :expandedRowKeys="expRowKeys"
      :pagination="table.hasPages ? { pageSize: table.maxPerPgs } : false"
      :loading="loading"
      bordered
      :custom-row="
        (record: any) => ({
          onClick: () => fmEmitter.emit('update:show', {
            show: true,
            cpyRcd: (tgt: any) => actCopy(record, tgt),
            viewOnly: true
          })
        })
      "
    >
      <template #customFilterIcon="{ column, filtered }">
        <search-outlined
          v-if="column.searchable"
          :style="{ color: filtered ? '#108ee9' : undefined }"
        />
        <filter-filled v-else :style="{ color: filtered ? '#108ee9' : undefined }" />
      </template>
      <template
        #customFilterDropdown="{ setSelectedKeys, selectedKeys, confirm, clearFilters, column }"
      >
        <div v-if="column.searchable" style="padding: 8px">
          <a-input
            ref="searchInput"
            :placeholder="`搜索${column.title}`"
            :value="selectedKeys[0]"
            style="width: 188px; margin-bottom: 8px; display: block"
            @change="(e: any) => setSelectedKeys(e.target.value ? [e.target.value] : [])"
            @pressEnter="onDoSearch(selectedKeys, confirm, column.dataIndex)"
          />
          <a-button
            type="primary"
            size="small"
            style="width: 90px; margin-right: 8px"
            @click="onDoSearch(selectedKeys, confirm, column.dataIndex)"
          >
            <template #icon><SearchOutlined /></template>
            搜索
          </a-button>
          <a-button size="small" style="width: 90px" @click="onSchReset(clearFilters)">
            重置
          </a-button>
        </div>
      </template>
      <template #bodyCell="{ text, column, record }">
        <template v-if="column.dataIndex === 'opera'">
          <template v-if="table.operaStyle === 'button'">
            <a-button
              v-if="table.operable.includes('可编辑')"
              size="small"
              class="mb-5"
              @click.stop="
                fmEmitter.emit('update:show', {
                  show: true,
                  cpyRcd: (tgt: any) => actCopy(record, tgt)
                })
              "
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
              @click.stop="
                fmEmitter.emit('update:show', {
                  show: true,
                  cpyRcd: (tgt: any) => actCopy(record, tgt)
                })
              "
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
          :cell="((table.cells.find((cell: any) => cell.refer === column.dataIndex) || new Cells()) as Cells)"
          :text="
            column.dict && (text || '').toString() in column.dict
              ? column.dict[(text || '').toString()]
              : (text || '').toString()
          "
          :record="record"
          :search="searchState"
        />
      </template>
      <template v-if="table.expandURL" #expandedRowRender="{ record }">
        <iframe
          class="w-100"
          :style="{ height: table.expHeight !== -1 ? table.expHeight + 'px' : 'auto' }"
          :src="fmtStrByObj(/\s?@.+?(?=\s)/g, record, table.expandURL)"
        />
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
    <FormDialog :emitter="fmEmitter" :form="form" @submit="onRecordSave" />
  </IndexLayout>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import IndexLayout from '../layout/index.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Form from '../types/form'
import Table, { Cells } from '../types/table'
import { baseCopy, endsWith, fmtStrByObj } from '../utils'
import api from '../api'
import FormDialog from '../components/FormDialog.vue'
import Column from '../types/column'
import RefreshBox from '../components/RefreshBox.vue'
import SelColBox from '../components/SelColBox.vue'
import CellCard from '../components/CellCard.vue'
import Cell from '../types/cell'
import BchExpBox from '../components/BchExpBox.vue'
import BchImpBox from '../components/BchImpBox.vue'
import BchIpt from '../types/bchImport'
import BchEpt from '../types/bchExport'
/*return models.map(model => `import ${model.name} from '../types/${model.name}'`).join('\n')*/

const models: any[] =
  [] /*return '[' + models.map(model => JSON.stringify(model)).join(',\n  ') + ']'*/

const copies: Record<string, (src: any, tgt?: any, force?: boolean) => any> =
  {} /*return '{ ' + models.map(model => `'${model.name}': ${model.name}.copy`).join(', ') + ' }'*/

const bchIptCopies: Record<string, (src: any, tgt?: any, force?: boolean) => any> =
  {} /*return '{ ' + models.map(model => `'${model.name}': baseCopy(BchIpt, ${model.name}, () => '')`).join(', ') + ' }'*/

const bchEptCopies: Record<string, (src: any, tgt?: any, force?: boolean) => any> =
  {} /*return '{ ' + models.map(model => `'${model.name}': baseCopy(BchEpt, ${model.name}, () => ({ column: '', compare: '=' }))`).join(', ') + ' }'*/

export default defineComponent({
  name: 'Home',
  components: {
    IndexLayout,
    FormDialog,
    RefreshBox,
    CellCard,
    SelColBox,
    BchExpBox,
    BchImpBox
  },
  setup() {
    const layout = ref()
    const ctnrHeight = ref('500px')
    const actMdl = ref('')
    const actCopy = computed(() => copies[actMdl.value])
    const bchIptCopy = computed(() => bchIptCopies[actMdl.value])
    const bchEptCopy = computed(() => bchEptCopies[actMdl.value])
    const form = reactive(new Form())
    const table = reactive(new Table())
    const records = reactive([] as any[])
    const columns = computed(() => {
      const ret = table.columns.filter((column: Column) => !column.notDisplay)
      if (table.operable.includes('可编辑') || table.operable.includes('可删除')) {
        return ret.concat(new Column('操作', 'opera', { key: 'opera', width: 100 })) as Column[]
      } else {
        return ret as Column[]
      }
    })
    const fmEmitter = new Emitter()
    const expRowKeys = reactive([] as string[])
    const loading = ref(false)
    const searchState = reactive({
      text: '',
      column: ''
    })
    const searchInput = ref()

    onMounted(resize)
    window.onresize = resize

    function resize() {
      const tHeader = document.getElementsByClassName('ant-table-thead')[0]
      //表格内容距离顶部的距离
      const tHeaderBottom = tHeader ? tHeader.getBoundingClientRect().bottom : 0
      //窗体高度-表格内容顶部的高度-表格内容底部的高度
      // let height = document.body.clientHeight - tHeaderBottom - extraHeight
      ctnrHeight.value = `calc(100vh - ${tHeaderBottom + 48 + 56}px)`
    }
    async function refresh() {
      loading.value = true
      if (!actMdl.value) {
        return
      }
      const model = models.find((mdl: any) => mdl.name === actMdl.value)
      Form.copy(model.form, form, true)
      Table.copy(model.table, table, true)
      records.splice(
        0,
        records.length,
        ...(await api.all(actMdl.value)).map((record: any) => actCopy.value(record))
      )
      loading.value = false
    }
    async function onRecordSave(record: any, next: () => void) {
      loading.value = true
      if (record.key) {
        await api.update(actMdl.value, record.key, record)
      } else {
        await api.add(actMdl.value, record)
      }
      await refresh()
      next()
    }
    async function onRecordDel(record: any) {
      loading.value = true
      await api.remove(actMdl.value, record.key)
      await refresh()
    }
    async function onMuItmChange(mname: string) {
      actMdl.value = mname
      await refresh()
    }
    function onRowExpand(record: { key: string }) {
      if (expRowKeys.includes(record.key)) {
        expRowKeys.splice(expRowKeys.indexOf(record.key), 1)
      } else {
        expRowKeys.push(record.key)
      }
    }
    function onDoSearch(selectedKeys: string[], confirm: () => void, dataIndex: string) {
      confirm()
      searchState.text = selectedKeys[0]
      searchState.column = dataIndex
    }

    function onSchReset(clearFilters: (param: any) => void) {
      clearFilters({ confirm: true })
      searchState.text = ''
    }
    return {
      Cells,

      layout,
      ctnrHeight,
      actMdl,
      actCopy,
      form,
      table,
      records,
      fmEmitter,
      columns,
      copies,
      expRowKeys,
      loading,
      bchIptCopy,
      bchEptCopy,
      searchState,
      searchInput,

      refresh,
      endsWith,
      onRecordSave,
      onRecordDel,
      onMuItmChange,
      onRowExpand,
      fmtStrByObj,
      onDoSearch,
      onSchReset
    }
  }
})
</script>

<style lang="less">
.unstyled-list {
  padding-left: 0;
  list-style: none;
  margin-bottom: 0 !important;
}

.mb-0 {
  margin-bottom: 0 !important;
}

.mb-3 {
  margin-bottom: 3px !important;
}

.mb-5 {
  margin-bottom: 5px !important;
}

.mb-10 {
  margin-bottom: 10px !important;
}

.p-10 {
  padding: 10px !important;
}

.w-100 {
  width: 100%;
}
</style>
