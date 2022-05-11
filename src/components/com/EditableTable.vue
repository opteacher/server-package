<template>
  <a-row class="mb-10" type="flex">
    <a-col flex="auto">
      <a-space>
        <h3 class="mb-0">{{ title }}</h3>
        <span style="color: rgba(0, 0, 0, 0.45)">{{ description }}</span>
      </a-space>
    </a-col>
    <a-col style="text-align: right" v-if="addable" flex="100px">
      <a-button class="float-right" type="primary" @click="onEditClicked()">添加</a-button>
    </a-col>
  </a-row>
  <a-table
    :columns="cols"
    :data-source="records.data"
    :size="size"
    :rowClassName="() => 'white-bkgd'"
    :pagination="false"
    bordered
    :scroll="{ y: sclHeight }"
  >
    <template #bodyCell="{ text, column, record }">
      <template v-if="column.key === 'opera'">
        <a v-if="edtable" class="mr-5" @click="onEditClicked(record)">编辑</a>
        <a-popconfirm
          v-if="delable"
          title="确定删除该记录吗？"
          ok-text="确定"
          cancel-text="取消"
          @confirm="onRecordDel(record.key)"
        >
          <a style="color: #ff4d4f">删除</a>
        </a-popconfirm>
      </template>
      <template v-else-if="$slots[column.key]">
        <slot :name="column.key" v-bind="{ record }" />
      </template>
      <template v-else>
        {{ text }}
      </template>
    </template>
  </a-table>
  <FormDialog
    v-model:show="editing.show"
    :copy="copy"
    :title="title"
    :emitter="emitter"
    :mapper="editMapper"
    @submit="onRecordSave"
  />
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { InfoCircleOutlined, SelectOutlined, EditOutlined } from '@ant-design/icons-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import FormDialog from './FormDialog.vue'
import Column from '@/types/column'
import Mapper from '@/types/mapper'

export default defineComponent({
  name: 'edtableTable',
  emits: ['add', 'edit', 'save', 'delete'],
  components: {
    InfoCircleOutlined,
    SelectOutlined,
    EditOutlined,
    FormDialog
  },
  props: {
    api: { type: Object /* ComAPI */, required: true },
    columns: { type: Array, required: true },
    mapper: { type: Mapper, required: true },
    copy: { type: Function, default: () => ({ key: '#' }) },
    emitter: { type: Emitter, default: null },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    size: { type: String, default: 'default' },
    pagable: { type: Boolean, default: true },
    numPerPg: { type: Number, default: 100 },
    sclHeight: { type: Number, default: 300 },
    filter: { type: Function, default: () => true },
    edtable: { type: Boolean, default: true },
    addable: { type: Boolean, default: true },
    delable: { type: Boolean, default: true }
  },
  setup(props, { emit }) {
    const cols =
      props.edtable || props.delable
        ? props.columns.concat(new Column('操作', 'opera', { width: 100 }))
        : props.columns
    const editMapper = reactive(props.mapper)
    const records = reactive({
      data: [] as unknown[],
      offset: 0,
      limit: props.numPerPg
    })
    const expRowKeys = reactive([] as string[])
    const editing = reactive({
      show: false,
      key: ''
    })

    onMounted(refresh)
    if (props.emitter) {
      props.emitter.on('refresh', refresh)
      props.emitter.on('update:mapper', (mapper: any) => {
        Mapper.copy(mapper, editMapper)
      })
    }

    async function refresh(data?: any[]) {
      records.data = data || (await props.api.all(records.offset, records.limit))
      editing.key = ''
      editing.show = false
    }
    function onEditClicked(record?: any) {
      emit('add', record)
      if (record) {
        props.emitter.emit('update:data', record)
      }
      editing.key = record && record.key ? record.key : ''
      editing.show = true
    }
    async function onRecordSave(record: any, reset: () => void) {
      if (editing.key === '') {
        await props.api.add(record)
      } else {
        await props.api.update(record)
      }
      emit('save', record, refresh)
      editing.show = false
      reset()
      await refresh()
    }
    function onCclClicked() {
      refresh()
    }
    async function onRecordDel(key: unknown) {
      await props.api.remove(key)
      emit('delete', key, refresh)
      editing.show = false
      await refresh()
    }
    function hasExpand() {
      for (const value of Object.values(editMapper)) {
        if (value.expanded) {
          return true
        }
      }
      return false
    }
    function isCustomEmpty() {
      for (const value of Object.values(editMapper)) {
        if (value.empty) {
          return true
        }
      }
      return false
    }
    function onRowExpand(record: { key: string }) {
      if (expRowKeys.includes(record.key)) {
        expRowKeys.splice(expRowKeys.indexOf(record.key), 1)
      } else {
        expRowKeys.push(record.key)
      }
    }
    return {
      cols,
      editMapper,
      records,
      expRowKeys,
      editing,

      onEditClicked,
      onRecordSave,
      onCclClicked,
      onRecordDel,
      hasExpand,
      onRowExpand,
      isCustomEmpty
    }
  }
})
</script>

<style lang="less" scoped>
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
