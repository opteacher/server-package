<template>
  <LytDesign @change:height="height => (hdHeight = height)">
    <div class="table-container" :style="{ top: `${40 + hdHeight}px` }">
      <a-layout class="h-100">
        <a-layout-content class="main-panel" @click="selected = ''">
          <div class="white-bkgd p-10">
            <a-row class="mb-10" type="flex">
              <a-col flex="auto">
                <a-space>
                  <h3 class="mb-0">{{ table.title }}</h3>
                  <span style="color: rgba(0, 0, 0, 0.45)">{{ table.desc }}</span>
                </a-space>
              </a-col>
              <a-col flex="100px">
                <a-button class="float-right" type="primary">添加</a-button>
              </a-col>
            </a-row>
            <a-table
              class="demo-table"
              :columns="columns"
              :data-source="demoRecord"
              :size="table.size"
              :rowClassName="() => 'white-bkgd'"
              :pagination="table.hasPages"
              bordered
            >
              <template #headerCell="{ title, column }">
                <span
                  :style="{ color: selected === `head_${column.key}` ? '#1890ff' : '#000000d9' }"
                >
                  {{ title }}
                </span>
              </template>
              <template #bodyCell="{ text, column }">
                <template v-if="column.dataIndex === 'opera'">
                  <template v-if="table.operaStyle === 'button'">
                    <a-button size="small" class="mb-5">编辑</a-button>
                    <a-button size="small" danger>删除</a-button>
                  </template>
                  <template v-else>
                    <a class="mr-5">编辑</a>
                    <a style="color: #ff4d4f">删除</a>
                  </template>
                </template>
                <span
                  v-else
                  :style="{
                    color:
                      selected === `cell_${column.dataIndex}`
                        ? '#1890ff'
                        : entries[column.dataIndex].color
                  }"
                >
                  {{
                    entries[column.dataIndex].prefix &&
                    !text.startsWith(entries[column.dataIndex].prefix)
                      ? entries[column.dataIndex].prefix
                      : ''
                  }}{{ text
                  }}{{
                    entries[column.dataIndex].suffix &&
                    !endsWith(text, entries[column.dataIndex].suffix)
                      ? entries[column.dataIndex].suffix
                      : ''
                  }}
                </span>
              </template>
              <template #emptyText>
                <a-empty>
                  <template #description>未查询到数据</template>
                  <a-button type="primary" @click.stop="fmEmitter.emit('update:show', true)">
                    点击创建一条演示记录
                  </a-button>
                  <DemoForm :emitter="fmEmitter" @submit="onFormSubmit" />
                </a-empty>
              </template>
            </a-table>
          </div>
        </a-layout-content>
        <a-layout-sider width="30%" class="white-bkgd p-20 vertical-scroll">
          <a-descriptions
            v-if="!selected"
            class="mb-50"
            title="表参数"
            :column="1"
            bordered
            size="small"
          >
            <a-descriptions-item label="标题">
              <a-input
                :value="table.title"
                @change="e => store.dispatch('model/saveTable', { title: e.target.value })"
              />
            </a-descriptions-item>
            <a-descriptions-item label="描述">
              <a-input
                :value="table.desc"
                @change="e => store.dispatch('model/saveTable', { desc: e.target.value })"
              />
            </a-descriptions-item>
            <a-descriptions-item label="操作分隔">
              <a-select
                class="w-100"
                :options="[
                  { label: '按钮', value: 'button' },
                  { label: '链接', value: 'link' }
                ]"
                :value="table.operaStyle"
                @change="operaStyle => store.dispatch('model/saveTable', { operaStyle })"
              />
            </a-descriptions-item>
            <a-descriptions-item label="尺寸">
              <a-select
                class="w-100"
                :options="
                  ['default', 'middle', 'small'].map(item => ({ label: item, value: item }))
                "
                :value="table.size"
                @change="size => store.dispatch('model/saveTable', { size })"
              />
            </a-descriptions-item>
            <a-descriptions-item label="页码">
              <a-checkbox
                :checked="table.hasPages"
                @change="e => store.dispatch('model/saveTable', { hasPages: e.target.checked })"
              >
                {{ table.hasPages ? '有' : '无' }}
              </a-checkbox>
            </a-descriptions-item>
          </a-descriptions>
          <a-descriptions
            v-else-if="selected.startsWith('head_')"
            class="mb-50"
            title="列"
            :column="1"
            bordered
            size="small"
          >
            <a-descriptions-item label="标题">
              <a-input
                :value="selColumn.title"
                @change="
                  e =>
                    store.dispatch('model/saveColumn', {
                      key: selColumn.key,
                      title: e.target.value
                    })
                "
              />
            </a-descriptions-item>
            <a-descriptions-item label="宽度">
              <a-input-number
                class="w-100"
                :value="selColumn.width || 0"
                @change="width => store.dispatch('model/saveColumn', { key: selColumn.key, width })"
              />
            </a-descriptions-item>
            <a-descriptions-item label="对齐">
              <a-select
                class="w-100"
                :options="[
                  { label: '左对齐', value: 'left' },
                  { label: '居中对齐', value: 'center' },
                  { label: '右对齐', value: 'right' }
                ]"
                :value="selColumn.align || 'left'"
                @change="align => store.dispatch('model/saveColumn', { key: selColumn.key, align })"
              />
            </a-descriptions-item>
          </a-descriptions>
          <a-descriptions
            v-else-if="selected.startsWith('cell')"
            class="mb-50"
            title="项"
            :column="1"
            bordered
            size="small"
          >
            <a-descriptions-item label="颜色">
              <ColorField
                :color="selEntry.color"
                @submit="
                  ({ color, next }) => {
                    store
                      .dispatch('model/saveEntry', {
                        key: selCellKey,
                        color
                      })
                      .then(next)
                  }
                "
              />
            </a-descriptions-item>
            <a-descriptions-item label="前缀">
              <a-input
                :value="selEntry.prefix"
                @change="
                  e =>
                    store.dispatch('model/saveEntry', { key: selCellKey, prefix: e.target.value })
                "
              />
            </a-descriptions-item>
            <a-descriptions-item label="后缀">
              <a-input
                :value="selEntry.suffix"
                @change="
                  e =>
                    store.dispatch('model/saveEntry', { key: selCellKey, suffix: e.target.value })
                "
              />
            </a-descriptions-item>
          </a-descriptions>
        </a-layout-sider>
      </a-layout>
    </div>
  </LytDesign>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import LytDesign from '../layouts/LytDesign.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import DemoForm from '../components/DemoForm.vue'
import Column from '@/types/column'
import Table from '@/types/table'
import { skipIgnores, endsWith } from '@/utils'
import { v4 as uuidv4 } from 'uuid'
import ColorField from '../components/ColorField.vue'

export default defineComponent({
  name: 'Table',
  components: {
    LytDesign,
    DemoForm,
    ColorField
  },
  setup() {
    const store = useStore()
    const hdHeight = ref(0)
    const columns = computed(
      () =>
        store.getters['model/columns']
          .map((column: Column) =>
            Object.assign(
              {
                customHeaderCell: () => ({
                  onClick: (e: PointerEvent) => onHdCellClick(e, column.key)
                }),
                customCell: () => ({
                  onClick: (e: PointerEvent) => onCellClick(e, column.dataIndex)
                })
              },
              skipIgnores(column, ['slots'])
            )
          )
          .concat(
            skipIgnores(new Column('操作', 'opera', { key: uuidv4(), width: 100 }), ['slots'])
          ) as Column[]
    )
    const demoRecord = computed(() => store.getters['model/demoRecord'])
    const fmEmitter = new Emitter()
    const selected = ref('')
    const table = computed(() => store.getters['model/table'] as Table)
    const entries = computed(() => (store.getters['model/table'] as Table).entries)
    const selColumn = computed(() =>
      store.getters['model/columns'].find(
        (column: any) => column.key === selected.value.substring('head_'.length)
      )
    )
    const selCellKey = computed(() => selected.value.substring('cell_'.length))
    const selEntry = computed(() => table.value.entries[selected.value.substring('cell_'.length)])

    function onHdCellClick(e: PointerEvent, colKey: string) {
      selected.value = `head_${colKey}`
      e.stopPropagation()
    }
    function onCellClick(e: PointerEvent, cellKey: string) {
      selected.value = `cell_${cellKey}`
      e.stopPropagation()
    }
    async function onFormSubmit(formState: any) {
      await store.dispatch('model/newRecord', formState)
    }
    return {
      store,
      table,
      hdHeight,
      columns,
      entries,
      demoRecord,
      selected,
      selColumn,
      selEntry,
      fmEmitter,
      selCellKey,

      onFormSubmit,
      endsWith
    }
  }
})
</script>

<style lang="less" scoped>
.main-panel {
  padding: 20px;
  width: 70%;
}

.table-container {
  position: fixed;
  bottom: 30px;
  left: 70px;
  right: 70px;
}

.demo-table {
  th:hover {
    cursor: pointer;
    background: rgba(0, 0, 0, 0.04);
  }
  tbody {
    tr:hover:not(.ant-table-expanded-row) > td {
      background: inherit;
    }
    td:hover {
      cursor: pointer;
      background: #fafafa !important;
    }
  }
}
</style>
