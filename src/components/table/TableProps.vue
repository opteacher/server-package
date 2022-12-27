<template>
  <a-descriptions class="mb-12" title="表参数" :column="1" bordered size="small">
    <template #extra>
      <a-switch
        v-model:checked="dispHidCol"
        checked-children="显示隐藏的列"
        un-checked-children="隐藏相应的列"
      />
    </template>
    <a-descriptions-item label="标题">
      <a-input
        v-model:value="formState.title"
        @blur="(e: any) => api.table.save({ title: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="描述">
      <a-input
        v-model:value="formState.desc"
        @blur="(e: any) => api.table.save({ desc: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="操作风格">
      <a-select
        class="w-full"
        :disabled="!formState.operable.length"
        :options="[
          { label: '按钮', value: 'button' },
          { label: '链接', value: 'link' }
        ]"
        :value="formState.operaStyle"
        @change="(operaStyle: any) => api.table.save({ operaStyle })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="尺寸">
      <a-select
        class="w-full"
        :options="['default', 'middle', 'small'].map(item => ({ label: item, value: item }))"
        :value="formState.size"
        @change="(size: any) => api.table.save({ size })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="页码">
      <a-input-group>
        <a-row :gutter="4">
          <a-col :span="6">
            <a-checkbox
              class="align-middle leading-7"
              :checked="formState.hasPages"
              @change="(e: any) => api.table.save({ hasPages: e.target.checked })"
            >
              {{ formState.hasPages ? '有' : '无' }}
            </a-checkbox>
          </a-col>
          <a-col :span="18">
            <a-input-number
              :disabled="!formState.hasPages"
              class="w-full"
              placeholder="输入单页可显示的最大记录数"
              v-model:value="formState.maxPerPgs"
              @change="(maxPerPgs: any) => api.table.save({ maxPerPgs })"
            />
          </a-col>
        </a-row>
      </a-input-group>
    </a-descriptions-item>
    <a-descriptions-item label="操作可否">
      <a-checkbox-group
        :value="formState.operable"
        :options="['可增加', '可编辑', '可删除']"
        @change="(operable: any) => api.table.save({ operable })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="数据刷新">
      <a-checkbox-group
        :value="formState.refresh"
        :options="[
          { label: '手动', value: 'manual' },
          { label: '自动', value: 'auto' }
        ]"
        @change="(refresh: any) => api.table.save({ refresh })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="显示列">
      <a-switch
        v-model:checked="formState.colDspable"
        @change="(colDspable: boolean) => api.table.save({ colDspable })"
      />
      &nbsp;{{ formState.colDspable ? '显示' : '不显示' }}
    </a-descriptions-item>
    <a-descriptions-item label="导入导出">
      <a-checkbox-group
        :disabled="!formState.operable.includes('可增加')"
        :value="formState.imExport"
        :options="[
          { label: '导入', value: 'import' },
          { label: '导出', value: 'export' }
        ]"
        @change="(imExport: any) => api.table.save({ imExport })"
      />
    </a-descriptions-item>
    <a-descriptions-item>
      <template #label>
        折叠内容
        <span>
          <a-tooltip>
            <template #title>
              填写折叠内容的页面URL。支持在URL中引用记录的字段，以^开头$结尾，支持多层引用
            </template>
            <info-circle-outlined />
          </a-tooltip>
        </span>
      </template>
      <a-mentions
        rows="3"
        v-model:value="formState.expandURL"
        @blur="(e: any) => api.table.save({ expandURL: e.target.value })"
      >
        <a-mentions-option v-for="prop in mdlProps" :key="prop.key" :value="prop.name">
          {{ prop.label }}
        </a-mentions-option>
      </a-mentions>
    </a-descriptions-item>
    <a-descriptions-item label="折叠界面高度">
      <a-input-number
        class="w-full"
        type="number"
        :precision="0"
        v-model:value="formState.expHeight"
        @blur="(e: any) => api.table.save({ expHeight: e.target.value })"
      >
        <template #addonAfter>px</template>
      </a-input-number>
    </a-descriptions-item>
    <a-descriptions-item label="演示数据">
      <a-button danger block type="primary" @click="onClrDemoClock">清空</a-button>
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Table from '@/types/table'
import { dispHidCol } from '@/views/Table'
import { Modal } from 'ant-design-vue'
import { computed, defineComponent, reactive } from 'vue'
import { useStore } from 'vuex'
import { mdlAPI as api } from '../../apis'
import { InfoCircleOutlined } from '@ant-design/icons-vue'
import Property from '@/types/property'

export default defineComponent({
  name: 'TableProps',
  components: {
    InfoCircleOutlined
  },
  props: {
    table: { type: Table, required: true }
  },
  setup(props) {
    const store = useStore()
    const formState = reactive(props.table)
    const mdlProps = computed(() => store.getters['model/ins'].props as Property[])
    return {
      Modal,

      store,
      api,
      mdlProps,
      formState,
      dispHidCol,
      onClrDemoClock: () =>
        Modal.confirm({
          title: '确定清空演示记录？',
          onOk: api.table.record.clr
        })
    }
  }
})
</script>
