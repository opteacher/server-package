<template>
  <a-descriptions class="mb-50" title="项" :column="1" bordered size="small">
    <a-descriptions-item label="条件">
      <a-select
        class="w-100"
        v-model:value="edtCells.selCond"
        :options="cdOptions"
        placeholder="默认属性"
        allowClear
      >
        <template #dropdownRender="{ menuNode: menu }">
          <v-nodes :vnodes="menu" />
          <a-divider style="margin: 4px 0" />
          <a-button class="w-100" type="link" @click="condStatic.visible = true">
            <template #icon><plus-outlined /></template>
            添加
          </a-button>
          <FormDialog
            title="条件"
            width="30vw"
            :copy="condStatic.copy"
            v-model:show="condStatic.visible"
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
        @blur="(e: any) => onPropSave('prefix', e.target.value)"
      />
    </a-descriptions-item>
    <a-descriptions-item label="后缀">
      <a-input
        v-model:value="edtCell.suffix"
        @blur="(e: any) => onPropSave('suffix', e.target.value)"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Cell from '@/types/cell'
import { computed, defineComponent, reactive, watch } from 'vue'
import ColorField from '@/components/table/ColorField.vue'
import { mdlAPI as api } from '@/apis'
import FormDialog from '@/components/com/FormDialog.vue'
import Mapper from '@/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Cells } from '@/types/table'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'CellProps',
  emits: ['update:cond'],
  components: {
    ColorField,
    FormDialog,

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
    const store = useStore()
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

    watch(() => edtCells.selCond, onCondChange)

    function buildCdLbl(conds: string[]): string {
      return [
        condStatic.mapper.prop.options.find((prop: any) => prop.value === conds[0]).label,
        condStatic.mapper.cmp.options.find((cmp: any) => cmp.value === conds[1]).label,
        conds[2] || '空'
      ].join(' ')
    }
    async function onColorSubmit({ color, next }: { color: string; next: () => void }) {
      await onPropSave('color', color)
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
    async function onPropSave(key: string, val: any) {
      if (edtCells.selCond) {
        await api.table.cells.cond.save(edtCells.refer, {
          [edtCells.selCond]: Object.assign(edtCell, { [key]: val })
        })
      } else {
        await api.table.cells.save({ refer: edtCells.refer, [key]: val })
      }
      return store.dispatch('model/refresh')
    }
    return {
      Cell,

      api,
      edtCells,
      edtCell,
      condStatic,
      cdOptions,

      onColorSubmit,
      onCondSubmit,
      onCondChange,
      onPropSave
    }
  }
})
</script>
