<template>
<div class="white-bkgd mb-10">
  <a-space class="p-10">
    <a-button v-if="addable" type="primary" @click="editing.key = ''">
      添加{{title}}
    </a-button>
    <template v-if="description">
      <InfoCircleOutlined style="color: #1890ff"/>
      <p class="mb-0">{{description}}</p>
    </template>
  </a-space>
  <a-table
    :dataSource="dataSrc"
    :columns="columns"
    :pagination="false"
    :size="size"
    style="overflow-y: hidden;"
  >
    <template
      v-for="(value, key) in dataMapper"
      :key="key"
      #[key]="{ text, record }"
    >
      <template v-if="value.type === 'Input'">
        <a-input
          v-if="record.key === editing.key"
          v-model:value="editing[key]"
          :placeholder="`输入${value.label}`"
        />
        <template v-else-if="$slots[key]">
          <slot :name="key" v-bind="{ record }"/>
        </template>
        <template v-else>{{text || '-'}}</template>
      </template>
      <template v-else-if="value.type === 'Select'">
        <a-select class="w-100"
          v-if="record.key === editing.key"
          v-model:value="editing[key]"
          :placeholder="`选择${value.label}`"
        >
          <a-select-option
            v-for="item in value.options"
            :key="typeof item === 'string' ? item : item.value"
            :value="typeof item === 'string' ? item : item.value"
          >
            {{typeof item === 'string' ? item : item.title}}
          </a-select-option>
        </a-select>
        <template v-else-if="$slots[key]">
          <slot :name="key" v-bind="{ record }"/>
        </template>
        <template v-else>{{text || '-'}}</template>
      </template>
      <template v-else-if="value.type === 'Checkbox'">
        <a-checkbox-group
          v-if="record.key === editing.key"
          v-model="editing[key]"
          :options="value.options"
        />
        <template v-else-if="$slots[key]">
          <slot :name="key" v-bind="{ record }"/>
        </template>
        <template v-else>{{record[key]}}</template>
      </template>
      <template v-else-if="value.type === 'Switch'">
        <a-checkbox
          v-if="record.key === editing.key"
          v-model:checked="editing[key]"
        >
          {{editing[key] ? (
            value.chkLabels ? value.chkLabels[1] : '是'
          ) : (
            value.chkLabels ? value.chkLabels[0] : '否'
          )}}
        </a-checkbox>
        <template v-else-if="$slots[key]">
          <slot :name="key" v-bind="{ record }"/>
        </template>
        <template v-else>
          {{record[key] ? (
            value.chkLabels ? value.chkLabels[1] : '是'
          ) : (
            value.chkLabels ? value.chkLabels[0] : '否'
          )}}
        </template>
      </template>
      <template v-else-if="value.type === 'Cascader'">
        <a-cascader
          v-if="record.key === editing.key"
          v-model:value="editing[key]"
          :options="value.options"
          :placeholder="`选择${value.label}`"
        />
        <template v-else-if="$slots[key]">
          <slot :name="key" v-bind="{ record }"/>
        </template>
        <template v-else>
          {{text || '-'}}
        </template>
      </template>
      <template v-else>
        <template v-if="$slots[key]">
          <slot :name="key" v-bind="{ record }"/>
        </template>
        <template v-else>
          {{text || '-'}}
        </template>
      </template>
    </template>
    <template #action="{ record }">
      <template v-if="record.key === editing.key">
        <ul class="unstyled-list">
          <li class="mb-3">
            <a-button
              type="primary" size="small"
              @click="onSaveSubmit"
            >保存</a-button>
          </li>
          <li>
            <a-button size="small"
              @click="onCclClicked()"
            >取消</a-button>
          </li>
        </ul>
      </template>
      <template v-else>
        <ul class="unstyled-list">
          <li v-if="editable" class="mb-3">
            <a-button size="small"
              @click="onEditClicked(record)"
            >编辑</a-button>
          </li>
          <li>
            <a-popconfirm
              title="确定删除该字段"
              @confirm="onDelSubmit(record.key)"
            >
              <a-button size="small" danger>删除</a-button>
            </a-popconfirm>
          </li>
        </ul>
      </template>
    </template>
    <template v-if="hasExpand()" #expandedRowRender="{ record }">
      <slot name="expandedRowRender" v-bind="{ record }"/>
    </template>
  </a-table>
</div>
</template>

<script lang="ts">
import { Mapper } from '@/common'
import { computed, defineComponent, nextTick, reactive, ref, watch, watchEffect } from 'vue'
import { InfoCircleOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'EditableTable',
  emits: ['add', 'save', 'delete'],
  components: {
    InfoCircleOutlined
  },
  props: {
    title: { type: String, default: ''},
    description: { type: String, default: '' },
    extra: { default: undefined },
    cols: { type: Array, required: true },
    size: { type: String, default: 'default' },
    data: { type: Array, required: true },
    copy: { type: Function, required: true },
    sclHeight: { type: Number, default: 300 },
    dataMapper: { type: Mapper, required: true },
    editable: { type: Boolean, default: true },
    addable: { type: Boolean, default: true }
  },
  setup (props, { emit }) {
    const columns = props.cols.concat({
      title: '操作',
      dataIndex: 'action',
      slots: { customRender: 'action' },
      width: 80
    })
    const propData = ref(props.data)
    const dataSrc = computed(() => {
      return (editing.key === '' ? [editing] : []).concat(propData.value)
    })
    const editing = reactive(props.copy({ key: '#' }))

    function refresh (data?: any[]) {
      if (typeof data !== 'undefined') {
        propData.value = data
      }
      editing.reset()
      editing.key = '#'
    }
    function onSaveSubmit () {
      emit('save', editing, props.extra, refresh)
      refresh()
    }
    function onCclClicked () {
      refresh()
    }
    function onEditClicked (record: any) {
      props.copy(record, editing)
    }
    function onDelSubmit (key: any) {
      emit('delete', key, props.extra, refresh)
      refresh()
    }
    function hasExpand () {
      for (const [_key, value] of Object.entries(props.dataMapper)) {
        if (value.expanded) {
          return true
        }
      }
      return false
    }
    return {
      columns,
      dataSrc,
      editing,

      onSaveSubmit,
      onCclClicked,
      onEditClicked,
      onDelSubmit,
      hasExpand,
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
