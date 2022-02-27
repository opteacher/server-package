<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      sub-title="回到编辑页"
      @back="router.go(-1)"
    />
    <a-layout>
      <a-layout-sider>Sider</a-layout-sider>
      <a-layout-content class="p-10">
        <a-table
          class="demo-table"
          :columns="columns"
          :data-source="demoRecord"
          :size="table.size"
          :rowClassName="() => 'white-bkgd'"
          :pagination="table.hasPages"
          bordered
        >
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
                color: entries[column.dataIndex].color
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
        </a-table>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script lang="ts">
import Column from '@/types/column'
import { skipIgnores, endsWith } from '@/utils'
import { computed, defineComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { v4 as uuidv4 } from 'uuid'
import Table from '@/types/table'

export default defineComponent({
  name: 'Demo',
  setup() {
    const store = useStore()
    const router = useRouter()
    const columns = computed(
      () =>
        store.getters['model/columns']
          .map((column: Column) => skipIgnores(column, ['slots']))
          .concat(
            skipIgnores(new Column('操作', 'opera', { key: uuidv4(), width: 100 }), ['slots'])
          ) as Column[]
    )
    const table = computed(() => store.getters['model/table'] as Table)
    const entries = computed(() => (store.getters['model/table'] as Table).entries)
    const demoRecord = computed(() => store.getters['model/demoRecord'])

    onMounted(() => store.dispatch('model/refresh'))

    return {
      router,
      columns,
      table,
      entries,
      demoRecord,

      endsWith
    }
  }
})
</script>
