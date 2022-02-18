<template>
  <div class="white-bkgd mb-10">
    <a-space class="p-10">
      <a-button v-if="addable" type="primary" @click="onAddClicked">添加{{ title }}</a-button>
      <template v-if="description">
        <InfoCircleOutlined style="color: #1890ff" />
        <p class="mb-0">{{ description }}</p>
      </template>
    </a-space>
    <a-table
      :dataSource="dataSrc"
      :columns="cols"
      :pagination="false"
      :size="size"
      style="overflow-y: hidden"
      v-model:expandedRowKeys="expRowKeys"
      :custom-row="record => ({ onClick: () => onRowExpand(record) })"
      @expand="(_expanded, record) => onRowExpand(record)"
    >
      <template v-for="(value, key) in editMapper" :key="key" #[key]="{ text, record }">
        <template v-if="record.key === editing.key && !validConds(value.display)">-</template>
        <template v-else-if="value.type === 'Input'">
          <a-input
            v-if="record.key === editing.key"
            v-model:value="editing[key]"
            :placeholder="`输入${value.label}`"
            :addon-before="value.prefix"
            :disabled="validConds(value.disabled)"
            @change="e => value.onChange(editing, e.target.value)"
          />
          <template v-else-if="$slots[key]">
            <slot :name="key" v-bind="{ record }" />
          </template>
          <template v-else>{{ text || '-' }}</template>
        </template>
        <template v-else-if="value.type === 'Select'">
          <a-select
            v-if="record.key === editing.key"
            class="w-100"
            :options="value.options"
            v-model:value="editing[key]"
            :placeholder="`选择${value.label}`"
            :disabled="validConds(value.disabled)"
            @change="opn => value.onChange(editing, opn, editing[key], emitter)"
          />
          <template v-else-if="$slots[key]">
            <slot :name="key" v-bind="{ record }" />
          </template>
          <template v-else>
            {{ text ? value.options.find(opn => opn.value === text).label : '-' }}
          </template>
        </template>
        <template v-else-if="value.type === 'Checkbox'">
          <a-checkbox-group
            v-if="record.key === editing.key"
            v-model="editing[key]"
            :options="value.options"
            :disabled="validConds(value.disabled)"
            @change="val => value.onChange(editing, val.target.checked)"
          />
          <template v-else-if="$slots[key]">
            <slot :name="key" v-bind="{ record }" />
          </template>
          <template v-else>{{ record[key] }}</template>
        </template>
        <template v-else-if="value.type === 'Switch'">
          <a-checkbox
            v-if="record.key === editing.key"
            v-model:checked="editing[key]"
            :disabled="validConds(value.disabled)"
            @change="val => value.onChange(editing, val.target.checked)"
          >
            {{
              editing[key]
                ? value.chkLabels
                  ? value.chkLabels[1]
                  : '是'
                : value.chkLabels
                ? value.chkLabels[0]
                : '否'
            }}
          </a-checkbox>
          <template v-else-if="$slots[key]">
            <slot :name="key" v-bind="{ record }" />
          </template>
          <template v-else>
            {{
              record[key]
                ? value.chkLabels
                  ? value.chkLabels[1]
                  : '是'
                : value.chkLabels
                ? value.chkLabels[0]
                : '否'
            }}
          </template>
        </template>
        <template v-else-if="value.type === 'Cascader'">
          <a-cascader
            v-if="record.key === editing.key"
            v-model:value="editing[key]"
            :options="value.options"
            :placeholder="`选择${value.label}`"
            :disabled="validConds(value.disabled)"
            @change="val => value.onChange(editing, val)"
          />
          <template v-else-if="$slots[key]">
            <slot :name="key" v-bind="{ record }" />
          </template>
          <template v-else>
            {{ text || '-' }}
          </template>
        </template>
        <template v-else-if="value.type === 'SelOrIpt'">
          <a-row v-if="record.key === editing.key" type="flex">
            <a-col flex="auto">
              <a-select
                v-if="value.mode === 'select'"
                style="width: 98%"
                :options="value.options"
                v-model:value="editing[key]"
              />
              <a-input v-else style="width: 98%" v-model:value="editing[key]" />
            </a-col>
            <a-col flex="32px">
              <a-button
                @click="
                  () => {
                    value.mode = value.mode === 'select' ? 'input' : 'select'
                  }
                "
              >
                <template #icon>
                  <SelectOutlined v-if="value.mode === 'select'" />
                  <EditOutlined v-else />
                </template>
              </a-button>
            </a-col>
          </a-row>
          <template v-else-if="$slots[key]">
            <slot :name="key" v-bind="{ record }" />
          </template>
          <template v-else>
            {{ text || '-' }}
          </template>
        </template>
        <template v-else>
          <template v-if="record.key === editing.key && $slots[`${key}Edit`]">
            <slot :name="`${key}Edit`" v-bind="{ editing }" />
          </template>
          <template v-else-if="$slots[key]">
            <slot :name="key" v-bind="{ record }" />
          </template>
          <template v-else>
            {{ text || '-' }}
          </template>
        </template>
      </template>
      <template v-if="edtable || delable" #opera="{ record }">
        <template v-if="record.key === editing.key">
          <ul class="unstyled-list">
            <li class="mb-3">
              <a-button type="primary" size="small" @click.stop="onSaveSubmit">保存</a-button>
            </li>
            <li>
              <a-button size="small" @click.stop="onCclClicked()">取消</a-button>
            </li>
          </ul>
        </template>
        <template v-else>
          <ul class="unstyled-list">
            <li v-if="edtable && filter(record, 'edit')" class="mb-3">
              <a-button size="small" @click.stop="onEditClicked(record)">编辑</a-button>
            </li>
            <li v-if="delable && filter(record, 'delete')">
              <a-popconfirm title="确定删除该字段" @confirm="onDelSubmit(record.key)">
                <a-button size="small" danger @click.stop>删除</a-button>
              </a-popconfirm>
            </li>
          </ul>
        </template>
      </template>
      <template v-if="hasExpand()" #expandedRowRender="{ record }">
        <slot name="expandedRowRender" v-bind="{ record }" />
      </template>
      <template v-if="isCustomEmpty()" #emptyText>
        <slot name="emptyText" />
      </template>
    </a-table>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Cond } from '@/types'
import Mapper from '@/types/mapper'
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { InfoCircleOutlined, SelectOutlined, EditOutlined } from '@ant-design/icons-vue'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { getProperty } from '@/utils'

export default defineComponent({
  name: 'edtableTable',
  emits: ['add', 'edit', 'save', 'delete'],
  components: {
    InfoCircleOutlined,
    SelectOutlined,
    EditOutlined
  },
  props: {
    dsKey: { type: String, required: true },
    columns: { type: Array, required: true },
    mapper: { type: Mapper, required: true },
    copy: { type: Function, default: () => ({ key: '#' }) },
    emitter: { type: Emitter, default: null },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    size: { type: String, default: 'default' },
    sclHeight: { type: Number, default: 300 },
    filter: { type: Function, default: () => true },
    edtable: { type: Boolean, default: true },
    addable: { type: Boolean, default: true },
    delable: { type: Boolean, default: true }
  },
  setup(props, { emit }) {
    const store = useStore()
    const cols =
      props.edtable || props.delable
        ? props.columns.concat({
            title: '操作',
            dataIndex: 'opera',
            slots: { customRender: 'opera' },
            width: 80
          })
        : props.columns
    const editMapper = reactive(props.mapper)
    const records = ref([] as unknown[])
    const dataSrc = computed(() => {
      return (editing.key === '' ? [editing] : []).concat(records.value)
    })
    const expRowKeys = reactive([] as string[])
    const editing = reactive(props.copy({ key: '#' }))

    onMounted(() => refresh())
    watch(
      () => getData(),
      () => refresh()
    )
    if (props.emitter) {
      props.emitter.on('refresh', () => refresh())
      props.emitter.on('update:mapper', (mapper: any) => {
        Mapper.copy(mapper, editMapper)
      })
    }

    function getData() {
      if (!store.getters) {
        return []
      }
      const data = getProperty(store.getters, props.dsKey)
      return data || []
    }
    function refresh(data?: unknown[]) {
      if (typeof data !== 'undefined') {
        records.value = data
      } else {
        records.value = getData()
      }
      if (editing.reset) {
        editing.reset()
      }
      editing.key = '#'
    }
    function onAddClicked() {
      editing.key = ''
      emit('add', editing)
    }
    function onSaveSubmit() {
      emit('save', editing, refresh)
    }
    function onCclClicked() {
      refresh()
    }
    function onEditClicked(record: unknown) {
      props.copy(record, editing)
      emit('edit')
    }
    function onDelSubmit(key: unknown) {
      emit('delete', key, refresh)
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
    function validConds(value: boolean | Cond[] | { [cmpRel: string]: Cond[] }): boolean {
      if (typeof value === 'boolean') {
        return value as boolean
      } else if (value && value.length) {
        return (value as Cond[])
          .map((cond: Cond) => cond.isValid(editing))
          .reduce((a: boolean, b: boolean) => a && b)
      } else {
        let ret = 'OR' in value ? true : false
        for (const [cmpRel, conds] of Object.entries(value)) {
          ret =
            ret &&
            (conds as Cond[])
              .map((cond: Cond) => cond.isValid(editing))
              .reduce((a: boolean, b: boolean) => {
                switch (cmpRel) {
                  case 'OR':
                    return a || b
                  case 'AND':
                  default:
                    return a && b
                }
              })
        }
        return ret
      }
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
      dataSrc,
      expRowKeys,
      editing,

      onAddClicked,
      onSaveSubmit,
      onCclClicked,
      onEditClicked,
      onDelSubmit,
      hasExpand,
      validConds,
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
