<template>
<div class="white-bkgd mb-10">
  <a-space class="p-10">
    <a-button v-if="addable" type="primary" @click="addMod = true">
      添加{{title}}
    </a-button>
    <template v-if="description">
      <InfoCircleOutlined style="color: #1890ff"/>
      <p class="mb-0">{{description}}</p>
    </template>
  </a-space>
  <a-table
    :dataSource="dataSource"
    :columns="columns"
    :pagination="false"
    style="overflow-y: hidden;"
  >
    <template
      v-for="(value, key) in dataMapper"
      :key="key"
      #[key]="{ index, text, record }"
    >
      <template v-if="value.type === 'Input'">
        <a-input
          v-if="index === edtKey"
          v-model:value="edtRecord[key]"
          :placeholder="`输入${value.label}`"
        />
        <template v-else-if="$slots[key]">
          <slot :name="key" v-bind="{ record }"/>
        </template>
        <template v-else>{{text || '-'}}</template>
      </template>
      <template v-else-if="value.type === 'Select'">
        <a-select class="w-100"
          v-if="index === edtKey"
          v-model:value="edtRecord[key]"
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
          v-if="index === edtKey"
          v-model="edtRecord[key]"
          :options="value.options"
        />
        <template v-else-if="$slots[key]">
          <slot :name="key" v-bind="{ record }"/>
        </template>
        <template v-else>{{record[key]}}</template>
      </template>
      <template v-else-if="value.type === 'Switch'">
        <a-checkbox
          v-if="index === edtKey"
          v-model:checked="edtRecord[key]"
        >
          {{edtRecord[key] ? (
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
          v-if="index === edtKey"
          v-model:value="edtRecord[key]"
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
    <template #action="{ index, record }">
      <template v-if="index === edtKey">
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
              @click="onEditClicked(index, record)"
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
import { computed, defineComponent, ref, watch } from 'vue'
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
    data: { type: Array, required: true },
    sclHeight: { type: Number, default: 300 },
    dftRecord: { type: Object, default: () => ({}) },
    dataMapper: { type: Mapper, required: true },
    editable: { type: Boolean, default: true },
    addable: { type: Boolean, default: true }
  },
  setup (props, { emit }) {
    const addMod = ref(false)
    const edtKey = ref(-1)
    const columns = props.cols.concat({
      title: '操作',
      dataIndex: 'action',
      slots: { customRender: 'action' },
      width: 80
    })
    const dataSource = computed(() => props.data)
    const edtRecord = ref(props.dftRecord)

    watch(() => addMod.value, () => {
      if (addMod.value) {
        dataSource.value.unshift(props.dftRecord)
        edtKey.value = 0
      } else {
        dataSource.value.shift()
        edtKey.value = -1
      }
    })

    function onAddClicked () {
      addMod.value = true
      edtKey.value = 0
    }
    function onSaveSubmit () {
      emit('save', edtRecord.value, props.extra)
      reset(true)
    }
    function onCclClicked () {
      reset()
    }
    function onEditClicked (index: number, record: any) {
      edtKey.value = index
      edtRecord.value = record
    }
    function onDelSubmit (key: any) {
      emit('delete', key, props.extra)
      reset(true)
    }
    function reset (reset = false) {
      addMod.value = false
      edtKey.value = -1
      if (reset) {
        edtRecord.value.reset()
      }
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
      addMod,
      columns,
      dataSource,
      edtKey,
      edtRecord,

      onAddClicked,
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
