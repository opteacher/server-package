<template>
  <IndexLayout ref="layout" @change="onMuItmChange">
    <EditableTable
      class="demo-table"
      :api="{ all: () => records }"
      sclHeight="h-full"
      :columns="columns"
      :mapper="mapper"
      :copy="copies[actMdl]"
      :emitter="emitter"
      :size="table.size"
      :pagable="table.hasPages"
      :refOptions="table.refresh"
      :dspCols="table.colDspable"
      :editable="table.operable.includes('可编辑')"
      :addable="table.operable.includes('可增加')"
      :delable="table.operable.includes('可删除')"
    />
  </IndexLayout>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import EditableTable from '@lib/frontend-library/components/EditableTable.vue'
import IndexLayout from '../layout/index.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Form from '../types/form'
import Table from '../types/table'
import api from '../api'
import { createByFields } from '@lib/frontend-library/types/mapper'
import Column from '@lib/frontend-library/types/column'
import { readFileSync } from 'fs'
/*return models.map(model => `import ${model.name} from '../types/${model.name}'`).join('\n')*/

const models = JSON.parse(readFileSync('../json/models.json').toString())
const layout = ref()
const ctnrHeight = ref('500px')
const actMdl = ref('')
const copies = {} /*return '{\n' + models.map(model => `  '${model.name}': ${model.name}.copy`).join(',\n') + '\n}'*/
const mapper = computed(() => createByFields(actMdl.value))
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
const emitter = new Emitter()
const expRowKeys = reactive([] as string[])
const loading = ref(false)
const searchState = reactive({
  text: '',
  column: ''
})

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
  const model = models[actMdl.value]
  Form.copy(model.form, form, true)
  Table.copy(model.table, table, true)
  records.splice(
    0,
    records.length,
    ...(await api.all(actMdl.value)).map((record: any) => copies(record))
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
</script>
