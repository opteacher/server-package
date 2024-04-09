<template>
  <a-descriptions class="mb-50" title="项" :column="1" bordered size="small">
    <a-descriptions-item label="条件">
      <a-select
        class="w-full"
        v-model:value="edtCells.selCond"
        :options="cdOptions"
        placeholder="默认属性"
        allowClear
      >
        <template #dropdownRender="{ menuNode: menu }">
          <v-nodes :vnodes="menu" />
          <a-divider class="my-1 mx-0" />
          <a-button class="w-full" type="link" @click="condStatic.visible = true">
            <template #icon><plus-outlined /></template>
            添加
          </a-button>
          <FormDialog
            title="条件"
            width="30vw"
            :copy="condStatic.copy"
            v-model:visible="condStatic.visible"
            :mapper="condStatic.mapper"
            :emitter="condStatic.emitter"
            @submit="onCondSubmit"
          />
        </template>
      </a-select>
    </a-descriptions-item>
    <a-descriptions-item label="颜色">
      <ColorField :color="edtCell.color" @submit="onColorSubmit" />
    </a-descriptions-item>
    <a-descriptions-item label="前缀">
      <a-input
        v-model:value="edtCell.prefix"
        @blur="(e: any) => onPropSave({ prefix: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="后缀">
      <a-input
        v-model:value="edtCell.suffix"
        @blur="(e: any) => onPropSave({ suffix: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="类型">
      <a-select
        class="w-full"
        :options="ctOptions"
        v-model:value="edtCell.ctype"
        @change="onCellTypeChange"
      />
    </a-descriptions-item>
    <template v-if="edtCell.ctype === 'Number' && isNumFmtAva(edtCell.format)">
      <a-descriptions-item label="小数点后保留位数">
        <a-input-number
          class="w-full"
          :min="-1"
          v-model:value="edtCell.format.fix"
          @change="(fix: number) => onFormatSave({ fix })"
        />
      </a-descriptions-item>
    </template>
    <template v-else-if="edtCell.ctype === 'DateTime' && isDateFmtAva(edtCell.format)">
      <a-descriptions-item label="时间格式">
        <a-select
          class="w-full"
          :options="fmtStatic.DateTime.options"
          v-model:value="edtCell.format.pattern"
          @change="(pattern: string) => onFormatSave({ pattern })"
        />
      </a-descriptions-item>
    </template>
    <template v-else-if="edtCell.ctype === 'Link' && isLinkFmtAva(edtCell.format)">
      <a-descriptions-item label="链接">
        <a-mentions
          rows="3"
          class="w-full"
          v-model:value="edtCell.format.href"
          @blur="(e: any) => onFormatSave({ href: e.target.value })"
        >
          <a-mentions-option v-for="prop in ppOptions" :key="prop.value" :value="prop.value">
            {{ prop.label }}
          </a-mentions-option>
        </a-mentions>
      </a-descriptions-item>
    </template>
  </a-descriptions>
</template>

<script lang="ts">
import Cell from '@/types/cell'
import { computed, defineComponent, reactive, watch } from 'vue'
import { mdlAPI as api } from '@/apis'
import Mapper from '@lib/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Cells } from '@/types/table'
import { PlusOutlined } from '@ant-design/icons-vue'
import { OpnType } from '@/types'

export default defineComponent({
  name: 'CellProps',
  emits: ['update:cond'],
  components: {
    PlusOutlined,
    VNodes: (_, { attrs }) => {
      return attrs.vnodes
    }
  },
  props: {
    props: { type: Array, required: true },
    pname: { type: String, required: true },
    cells: { type: Cells, required: true }
  },
  setup(props, { emit }) {
    const edtCells = reactive(props.cells)
    const edtCell = reactive(
      Cell.copy(props.cells.selCond ? props.cells.cdCell[props.cells.selCond] : props.cells)
    )
    const condStatic = reactive({
      mapper: new Mapper({
        prop: {
          label: '分量',
          type: 'Select',
          options: props.props,
          rules: [{ required: true, message: '请选择需比较的分量！', trigger: 'blur' }]
        },
        cmp: {
          label: '比较符',
          type: 'Select',
          options: [
            { label: '等于', value: '=' },
            { label: '不等于', value: '!=' },
            { label: '大于', value: '>' },
            { label: '大于等于', value: '>=' },
            { label: '小于', value: '<' },
            { label: '小于等于', value: '<=' }
          ],
          rules: [{ required: true, message: '请选择比较的方式！', trigger: 'blur' }]
        },
        value: {
          label: '目标值',
          type: 'Input',
          placeholder: '为空则不要填写'
        }
      }),
      emitter: new Emitter(),
      visible: false,
      copy: (src: any, tgt: any): any => {
        tgt = tgt || { prop: '', cmp: '=', value: '' }
        tgt.prop = src.prop || tgt.prop
        tgt.cmp = src.cmp || tgt.cmp
        tgt.value = src.value || tgt.value
        return tgt
      }
    })
    const cdOptions = computed(() =>
      Object.keys(edtCells.cdCell).map((cond: string) => ({
        label: buildCdLbl(cond.split('_')),
        value: cond
      }))
    )
    const ctOptions = [
      { label: '字符串', value: 'String' },
      { label: '数字', value: 'Number' },
      { label: '日期', value: 'DateTime' },
      { label: '链接', value: 'Link' }
    ]
    const fmtStatic = {
      DateTime: {
        options: [{ label: '年/月/日 时:分:秒', value: 'YYYY/MM/DD HH:mm:ss' }]
      }
    }
    const ppOptions = computed(() => props.props as OpnType[])

    watch(() => edtCells.selCond, onCondChange)
    watch(
      () => props.cells.refer,
      () => {
        Cell.copy(
          props.cells.selCond ? props.cells.cdCell[props.cells.selCond] : props.cells,
          edtCell
        )
      }
    )

    function buildCdLbl(conds: string[]): string {
      return [
        condStatic.mapper.prop.options.find((prop: any) => prop.value === conds[0]).label,
        condStatic.mapper.cmp.options.find((cmp: any) => cmp.value === conds[1]).label,
        conds[2] || '空'
      ].join(' ')
    }
    async function onColorSubmit({ color, next }: { color: string; next: () => void }) {
      await onPropSave({ color })
      next()
    }
    function onCondChange(cond: any) {
      if (edtCells.cdCell[cond]) {
        Cell.copy(edtCells.cdCell[cond], edtCell, true)
      } else {
        Cell.copy(edtCells, edtCell, true)
      }
      emit('update:cond', cond || '')
    }
    async function onCondSubmit(cond: any) {
      const value = `${cond.prop}_${cond.cmp}_${cond.value}`
      await api.table.cells.cond.save(edtCells.refer, { [value]: Cell.copy({}) })
      edtCells.cdCell[value] = Cell.copy({})
      condStatic.visible = false
      onCondChange(value)
    }
    function onPropSave(prop: any) {
      if (edtCells.selCond) {
        return api.table.cells.cond.save(edtCells.refer, {
          [edtCells.selCond]: Object.assign(edtCell, prop)
        })
      } else {
        return api.table.cells.save(Object.assign({ refer: edtCells.refer }, prop))
      }
    }
    function onCellTypeChange(ctype: string) {
      switch (ctype) {
        case 'String':
          edtCell.format = {}
          break
        case 'Number':
          edtCell.format = { fix: -1 }
          break
        case 'DateTime':
          edtCell.format = { pattern: 'YYYY/MM/DD HH:mm:ss' }
          break
        case 'Link':
          edtCell.format = { href: '' }
          break
      }
      return onPropSave({ ctype, format: edtCell.format })
    }
    function onFormatSave(format: any) {
      return api.table.cells.saveFmt(edtCells.refer, format, edtCells.selCond)
    }
    function isNumFmtAva(format: any) {
      return format && typeof format.fix !== 'undefined'
    }
    function isDateFmtAva(format: any) {
      return format && typeof format.pattern !== 'undefined'
    }
    function isLinkFmtAva(format: any) {
      return format && typeof format.href !== 'undefined'
    }
    return {
      Cell,

      api,
      edtCells,
      edtCell,
      condStatic,
      cdOptions,
      ctOptions,
      fmtStatic,
      ppOptions,

      onColorSubmit,
      onCondSubmit,
      onCondChange,
      onPropSave,
      onCellTypeChange,
      onFormatSave,
      isNumFmtAva,
      isDateFmtAva,
      isLinkFmtAva
    }
  }
})
</script>
