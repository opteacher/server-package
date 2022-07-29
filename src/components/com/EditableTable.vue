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
    v-model:expandedRowKeys="expRowKeys"
    bordered
    :scroll="{ y: sclHeight }"
    :custom-row="
      (record: any) => ({
        onClick: () => onRowClick(record)
      })
    "
    @expand="(_expanded: unknown, record: any) => onRowExpand(record)"
  >
    <template #headerCell="{ column }">
      <template v-if="$slots[column.key + 'HD']">
        <slot :name="column.key + 'HD'" v-bind="{ column }" />
      </template>
    </template>
    <template #bodyCell="{ text, column, record }">
      <template v-if="column.key === 'opera'">
        <a v-if="disabled(record, 'edit')" class="mr-5" disabled @click.stop="">编辑</a>
        <a v-else-if="edtable" class="mr-5" @click.stop="onEditClicked(record)">编辑</a>
        <a v-if="disabled(record, 'delete')" disabled @click.stop="">删除</a>
        <a-popconfirm
          v-else-if="delable"
          title="确定删除该记录吗？"
          ok-text="确定"
          cancel-text="取消"
          @confirm="onRecordDel(record.key)"
        >
          <a style="color: #ff4d4f" @click.stop="">删除</a>
        </a-popconfirm>
      </template>
      <template v-else-if="$slots[column.key]">
        <slot :name="column.key" v-bind="{ record }" />
      </template>
      <template v-else-if="typeof text === 'undefined' || text === null">-</template>
      <template v-else-if="typeof text === 'boolean'">{{ text ? '是' : '否' }}</template>
      <template v-else>{{ text }}</template>
    </template>
    <template v-if="hasExpand()" #expandedRowRender="{ record }">
      <slot name="expandedRowRender" v-bind="{ record }" />
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
  <FormDialog
    v-model:show="editing.show"
    :copy="copy"
    :title="title"
    :emitter="emitter"
    :mapper="editMapper"
    @submit="onRecordSave"
  >
    <template
      v-for="pname in Object.keys(editMapper).filter((key: any) => $slots[key + 'EDT'])"
      :key="pname"
      #[pname]="{ formState }"
    >
      <slot :name="pname + 'EDT'" v-bind="{ editing: formState, mapper: editMapper[pname] }" />
    </template>
  </FormDialog>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, onMounted, reactive } from 'vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import FormDialog from './FormDialog.vue'
import Column from '@/types/column'
import Mapper from '@/types/mapper'

export default defineComponent({
  name: 'edtableTable',
  emits: ['add', 'edit', 'before-save', 'save', 'delete', 'refresh'],
  components: {
    FormDialog
  },
  props: {
    api: { type: Object /* ComAPI */, required: true },
    columns: { type: Array, required: true },
    mapper: { type: Mapper, default: new Mapper() },
    copy: { type: Function, default: () => ({ key: '#' }) },
    emitter: { type: Emitter, default: null },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    size: { type: String, default: 'default' },
    pagable: { type: Boolean, default: true },
    numPerPg: { type: Number, default: 100 },
    sclHeight: { type: Number, default: 500 },
    filter: { type: Function, default: () => true },
    edtable: { type: Boolean, default: true },
    addable: { type: Boolean, default: true },
    delable: { type: Boolean, default: true },
    disabled: { type: Function, default: () => false }
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
      records.data = (data || (await props.api.all(records.offset, records.limit))).filter(
        props.filter
      )
      emit('refresh', records.data, (pcsData: any) => {
        records.data = pcsData
      })
      editing.key = ''
      editing.show = false
    }
    function onEditClicked(record?: any) {
      emit('add', record)
      editing.key = ''
      if (record) {
        props.emitter.emit('update:data', record)
        editing.key = record.key || ''
      }
      props.emitter.emit('viewOnly', false)
      editing.show = true
    }
    async function onRecordSave(record: any, reset: () => void) {
      emit('before-save', record)
      if (editing.key === '') {
        await props.api.add(record)
      } else {
        await props.api.update(record)
      }
      emit('save', record, refresh)
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
    function onRowClick(record: any) {
      props.emitter.emit('viewOnly', true)
      props.emitter.emit('update:data', record)
      editing.show = true
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
      isCustomEmpty,
      onRowClick
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
