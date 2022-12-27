<template>
  <a-button @click="visible = true">
    <template #icon><export-outlined /></template>
    批量导出
  </a-button>
  <FormDialog
    title="导出登记在案的资产"
    v-model:show="visible"
    :copy="copyFun"
    :emitter="emitter"
    :mapper="mapper"
    @submit="onSubmit"
  >
    <template #itfcTable="{ formState }">
      <a-form-item-rest>
        <a-table
          v-if="formState.worksheet"
          :columns="genDspColumns(formState)"
          :data-source="genDspRecords(formState)"
          :scroll="{ x: 'max-content' }"
          size="small"
          :pagination="false"
          bordered
        >
          <template #headerCell="{ column }">
            {{ column.title }}
            <a-input-group class="mt-5 w-full" compact>
              <a-select
                size="small"
                placeholder="等于……"
                class="w-9/12"
                :options="cols.map((col: Column) => ({ label: col.title, value: col.dataIndex }))"
                @select="(selected: string) => onAsIdenSelect(formState, selected, column.dataIndex)"
              />
              <a-button size="small">
                <template #icon><ellipsis-outlined /></template>
              </a-button>
            </a-input-group>
          </template>
          <template #footer>.....</template>
        </a-table>
      </a-form-item-rest>
    </template>
    <template #filterCols="{ formState }">
      <a-form-item-rest>
        <a-checkbox
          v-model:checked="allChk.checkAll"
          :indeterminate="allChk.indeterminate"
          @change="onAllChkChange"
        >
          全部选择
        </a-checkbox>
      </a-form-item-rest>
      <a-checkbox-group v-model:value="formState.filterCols" :options="colOpns" />
    </template>
  </FormDialog>
</template>

<script lang="ts">
import Mapper from '@lib/types/mapper'
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { ExportOutlined, EllipsisOutlined } from '@ant-design/icons-vue'
import Batch from '@/types/batch'
import { CellValue } from 'exceljs'
import Column from '@lib/types/column'
import ExcelJS from 'exceljs'
import { Cond } from '@/types'
import { upperFirst } from '@/utils'

export default defineComponent({
  name: 'BatchExportBox',
  components: {
    ExportOutlined,
    EllipsisOutlined
  },
  emits: ['submit'],
  props: {
    columns: { type: Array, required: true },
    copyFun: { type: Function, required: true }
  },
  setup(props, { emit }) {
    const visible = ref(false)
    const emitter = new Emitter()
    const cols = reactive(props.columns.map(col => Column.copy(col)))
    const allChk = reactive({
      indeterminate: true,
      checkAll: true
    })
    const colOpns = computed(() =>
      props.columns.map((col: any) => ({ label: col.title, value: col.dataIndex }))
    )

    onMounted(resetAllChk)
    watch(
      () => props.columns,
      () => {
        cols.splice(0, cols.length, ...props.columns.map(col => Column.copy(col)))
        resetAllChk()
      }
    )

    function resetAllChk() {
      emitter.emit('update:data', { filterCols: cols.map((col: Column) => col.dataIndex) })
      allChk.checkAll = true
      allChk.indeterminate = false
    }
    function genDspColumns(formState: Batch) {
      if (!formState.worksheet) {
        return []
      }
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d') as CanvasRenderingContext2D
      context.font = '14px Microsoft YaHei'
      const ret = (formState.worksheet.getRow(formState.hdRowNo).values as CellValue[]).map(
        (val: CellValue, idx: number) => {
          const txt = val as string
          const textmetrics = context.measureText(txt)
          const width = textmetrics.width << 1
          return new Column(txt, idx.toString(), {
            customCell: () => ({
              style: {
                'min-width': `${width}px`,
                'white-space': 'nowrap',
                'text-overflow': 'ellipsis',
                overflow: 'hidden'
              }
            })
          })
        }
      )
      canvas.remove()
      return ret
    }
    function genDspRecords(formState: Batch) {
      if (!formState.worksheet) {
        return []
      }
      const ret = [formState.worksheet.getRow(formState.dtRowNo).values]
      if (formState.dtRowNo + 1 < formState.worksheet.rowCount) {
        ret.push(formState.worksheet.getRow(formState.dtRowNo + 1).values)
      }
      return ret
    }
    function onAsIdenSelect(formState: any, selected: string, prop: string) {
      for (const [key, val] of Object.entries(formState)) {
        if (key.startsWith('col') && val === prop) {
          formState[key] = ''
          break
        }
      }
      formState[`col${upperFirst(selected)}`] = prop
      cols.splice(
        0,
        cols.length,
        ...(props.columns as Column[]).filter(
          (col: Column) => !formState[`col${upperFirst(col.dataIndex)}`]
        )
      )
    }
    function onAllChkChange(e: any) {
      emitter.emit('update:data', {
        filterCols: e.target.checked ? cols.map((col: Column) => col.dataIndex) : []
      })
    }
    async function onSubmit(info: any, next: () => void) {
      info.ttlMap = Object.fromEntries(props.columns.map((col: any) => [col.dataIndex, col.title]))
      emit('submit', info)
      next()
    }
    return {
      visible,
      emitter,
      mapper,
      cols,
      colOpns,
      allChk,

      genDspColumns,
      genDspRecords,
      onAsIdenSelect,
      onAllChkChange,
      onSubmit
    }
  }
})

const mapper = new Mapper({
  file: {
    label: '上传参照文档',
    type: 'Upload',
    desc: '没有参照文档，则导出所有设备',
    path: '/police-assets/api/v1/excel/upload',
    headers: { authorization: `Bearer ${localStorage.getItem('token')}` },
    onChange: (form: any, file: any) => {
      if (file.status === 'done') {
        console.log(form, file)
        const reader = new FileReader()
        reader.readAsArrayBuffer(file.originFileObj)
        reader.onload = async () => {
          const workbook = new ExcelJS.Workbook()
          await workbook.xlsx.load(Buffer.from(reader.result as ArrayBuffer))
          form.worksheet = workbook.getWorksheet(1)
        }
      }
    }
  },
  hdRowNo: {
    label: '标题行号',
    type: 'Number',
    iptType: 'number',
    display: [
      Cond.copy({ key: 'file.length', cmp: '!=', val: 0 }),
      Cond.copy({ key: 'file[0].status', cmp: '!=', val: 'done' })
    ]
  },
  dtRowNo: {
    label: '数据开始行号',
    type: 'Number',
    iptType: 'number',
    display: [
      Cond.copy({ key: 'file.length', cmp: '!=', val: 0 }),
      Cond.copy({ key: 'file[0].status', cmp: '!=', val: 'done' })
    ]
  },
  itfcTable: {
    label: '指定对照列',
    type: 'Unknown',
    display: [
      Cond.copy({ key: 'file.length', cmp: '!=', val: 0 }),
      Cond.copy({ key: 'file[0].status', cmp: '!=', val: 'done' })
    ]
  },
  filterCols: {
    label: '导出列',
    type: 'Unknown'
  }
})
</script>
