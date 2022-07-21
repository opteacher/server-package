<template>
  <a-descriptions class="mb-50" title="项" :column="1" bordered size="small">
    <a-descriptions-item label="条件">
      <a-select
        class="w-100"
        v-model:value="selCond"
        :options="condOpns"
        placeholder="默认属性"
        @change="onCondChange"
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
            :show="condStatic.visible"
            :mapper="condStatic.mapper"
            :emitter="condStatic.emitter"
            @update:show="
              show => {
                condStatic.visible = show
              }
            "
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
        @blur="(e: any) => api.table.cells.save({ refer: edtCell.refer, prefix: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="后缀">
      <a-input
        v-model:value="edtCell.suffix"
        @blur="(e: any) => api.table.cells.save({ refer: edtCell.refer, suffix: e.target.value })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Cell from '@/types/cell'
import { defineComponent, reactive, ref } from 'vue'
import ColorField from '@/components/table/ColorField.vue'
import { mdlAPI as api } from '@/apis'
import FormDialog from '@/components/com/FormDialog.vue'
import Mapper from '@/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Cells } from '@/types/table'
import { PlusOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'TableProps',
  emits: ['change'],
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
    cell: { type: Cells, required: true }
  },
  setup(props) {
    const edtCell = reactive(props.cell)
    const selCond = ref('')
    const condOpns = reactive(
      Object.keys(props.cell.cdCell).map((cond: string) => ({ label: cond, value: cond }))
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

    async function onColorSubmit({ color, next }: { color: string; next: () => void }) {
      await api.table.cells.save({ refer: edtCell.refer, color })
      next()
    }
    function onCondChange(cond: string) {
      Cell.copy(props.cell.cdCell[cond], edtCell, true)
    }
    function onCondSubmit(cond: any) {
      const value = `${cond.prop}_${cond.cmp}_${cond.value}`
      condOpns.push({
        label: [
          condStatic.mapper.prop.options.find((prop: any) => prop.value === cond.prop).label,
          condStatic.mapper.cmp.options.find((cmp: any) => cmp.value === cond.cmp).label,
          cond.value || '空'
        ].join(' '),
        value
      })
      edtCell.cdCell[value] = Cell.copy({})
      condStatic.visible = false
      selCond.value = value
      onCondChange(value)
    }
    return {
      Cell,

      api,
      edtCell,
      selCond,
      condOpns,
      condStatic,

      onColorSubmit,
      onCondChange,
      onCondSubmit
    }
  }
})
</script>
