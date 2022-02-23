<template>
  <LytDesign @change:height="height => (hdHeight = height)">
    <div class="table-container" :style="{ top: `${40 + hdHeight}px` }">
      <a-layout class="h-100">
        <a-layout-content class="main-panel" @click="selected = ''">
          <div class="white-bkgd">
            <a-table
              class="demo-table"
              :columns="columns"
              :data-source="example"
              :size="table.size"
            >
              <template #headerCell="{ title, column }">
                <span :style="{ color: column.key === selected ? '#1890ff' : '#000000d9' }">
                  {{ title }}
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
            v-show="!selected"
            class="mb-50"
            title="表参数"
            :column="1"
            bordered
            size="small"
          >
            <a-descriptions-item label="尺寸">
              <a-select
                class="w-100"
                :options="
                  ['default', 'middle', 'small'].map(item => ({ label: item, value: item }))
                "
                :value="table.size"
                @change="e => store.dispatch('model/saveTable', { size: e.target.value })"
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
import { computed, defineComponent, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import LytDesign from '../layouts/LytDesign.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import DemoForm from '../components/DemoForm.vue'
import Column from '@/types/column'
import Table from '@/types/table'

export default defineComponent({
  name: 'Table',
  components: {
    LytDesign,
    DemoForm
  },
  setup() {
    const store = useStore()
    const hdHeight = ref(0)
    const columns = computed(() =>
      store.getters['model/columns'].map((column: Column) =>
        Object.assign(
          {
            customHeaderCell: (col: Column) => ({
              onClick: (e: PointerEvent) => onHdCellClick(e, col.key)
            })
          },
          column
        )
      )
    )
    const example = reactive([])
    const fmEmitter = new Emitter()
    const selected = ref('')
    const table = computed(() => store.getters['model/table'] as Table)

    function onHdCellClick(e: PointerEvent, colKey: string) {
      selected.value = colKey
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
      example,
      selected,
      fmEmitter,

      onFormSubmit
    }
  }
})
</script>

<style lang="less">
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
}
</style>