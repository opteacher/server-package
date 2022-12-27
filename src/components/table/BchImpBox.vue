<template>
  <a-button @click="visible = true">
    <template #icon><import-outlined /></template>
    批量导入
  </a-button>
  <FormDialog
    title="导入登记在案的资产"
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
            {{ column.title }}&nbsp;
            <a-select
              class="mt-5"
              size="small"
              placeholder="绑定到……"
              :style="{ 'min-width': '100px', 'max-width': `${column.width}px` }"
              :options="cols.map((col: Column) => ({ label: col.title, value: col.dataIndex }))"
              @select="(selected: string) => onBdPropSelect(formState, selected, column.dataIndex)"
            />
          </template>
          <template #footer>.....</template>
        </a-table>
      </a-form-item-rest>
    </template>
    <template #boolMapper="{ formState }">
      <a-form-item-rest>
        <a-row :gutter="8">
          <a-col :span="12">
            <a-input v-model:value="formState.boolMapper['TRUE']" placeholder="输入真值" />
          </a-col>
          <a-col :span="12">
            <a-input v-model:value="formState.boolMapper['FALSE']" placeholder="输入假值" />
          </a-col>
        </a-row>
      </a-form-item-rest>
    </template>
  </FormDialog>
</template>

<script lang="ts">
import { defineComponent, reactive, ref, watch } from 'vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Mapper from '@/types/mapper'
import ExcelJS, { CellValue } from 'exceljs'
import { Cond } from '@/types'
import { upperFirst } from '@/utils'
import Batch from '@/types/batch'
import Column from '@/types/column'
import { ImportOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'BatchImportBox',
  components: {
    ImportOutlined
  },
  emits: ['refresh', 'submit'],
  props: {
    columns: { type: Array, required: true },
    copyFun: { type: Function, required: true }
  },
  setup(props, { emit }) {
    const emitter = new Emitter()
    const visible = ref(false)
    const cols = reactive(props.columns.map(col => Column.copy(col)))

    watch(
      () => props.columns,
      () => cols.splice(0, cols.length, ...props.columns.map(col => Column.copy(col)))
    )

    async function onSubmit(info: any, next: () => void) {
      emit('submit', info)
      next()
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
            width,
            customCell: () => ({
              style: {
                'min-width': '100px',
                'max-width': `${width}px`,
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
    function onBdPropSelect(formState: any, selected: string, prop: string) {
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
    return {
      visible,
      emitter,
      mapper,
      cols,

      onSubmit,
      genDspColumns,
      genDspRecords,
      onBdPropSelect
    }
  }
})

const mapper = new Mapper({
  file: {
    label: '上传在案资产',
    type: 'Upload',
    rules: [
      {
        required: true,
        message: '必须选择要上传的Excel文件！'
      }
    ],
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
    rules: [
      {
        required: true,
        message: '必须填写填写标题行号，用于收集标题信息！'
      }
    ],
    display: [
      Cond.copy({ key: 'file.length', cmp: '!=', val: 0 }),
      Cond.copy({ key: 'file[0].status', cmp: '!=', val: 'done' })
    ]
  },
  dtRowNo: {
    label: '数据开始行号',
    type: 'Number',
    iptType: 'number',
    rules: [
      {
        required: true,
        message: '必须填写填写标题行号，用于收集数据！'
      }
    ],
    display: [
      Cond.copy({ key: 'file.length', cmp: '!=', val: 0 }),
      Cond.copy({ key: 'file[0].status', cmp: '!=', val: 'done' })
    ]
  },
  itfcTable: {
    label: '对接表',
    type: 'Unknown',
    display: [
      Cond.copy({ key: 'file.length', cmp: '!=', val: 0 }),
      Cond.copy({ key: 'file[0].status', cmp: '!=', val: 'done' })
    ]
  },
  advanced: {
    label: '高级',
    type: 'Group',
    display: [
      Cond.copy({ key: 'file.length', cmp: '!=', val: 0 }),
      Cond.copy({ key: 'file[0].status', cmp: '!=', val: 'done' })
    ],
    items: {
      boolMapper: {
        label: '布尔对应值',
        type: 'Unknown'
      },
      dtTmFormat: {
        label: '日期时间格式',
        type: 'Input'
      }
    }
  }
})
</script>
