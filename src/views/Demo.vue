<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      sub-title="回到编辑页"
      @back="router.go(-1)"
    >
      <template #extra>
        <a-switch
          v-model:checked="useRealData"
          checked-children="真实"
          un-checked-children="模板"
          @change="onRefresh"
        />
        &nbsp;数据
        <a-button v-if="useRealData" @click="onRefresh">刷新</a-button>
      </template>
    </a-page-header>
    <a-layout class="mt-10 h-100">
      <a-layout-sider>
        <a-menu
          :selectedKeys="[model.key]"
          mode="inline"
          :style="{ height: '100%', borderRight: 0 }"
        >
          <a-menu-item :key="model.key">
            <template #icon>
              <BorderlessTableOutlined />
            </template>
            <span>{{ model.desc || model.name }}</span>
          </a-menu-item>
        </a-menu>
      </a-layout-sider>
      <a-layout-content class="p-10 white-bkgd">
        <a-row class="mb-10" type="flex">
          <a-col flex="auto">
            <a-space>
              <h3 class="mb-0">{{ table.title }}</h3>
              <span style="color: rgba(0, 0, 0, 0.45)">{{ table.desc }}</span>
            </a-space>
          </a-col>
          <a-col v-if="table.operable.includes('可增加')" flex="100px">
            <a-button
              class="float-right"
              type="primary"
              @click="fmEmitter.emit('update:show', true)"
            >
              添加
            </a-button>
          </a-col>
        </a-row>
        <a-table
          :columns="columns"
          :data-source="records"
          :size="table.size"
          :rowClassName="() => 'white-bkgd'"
          :pagination="table.hasPages"
          bordered
        >
          <template #bodyCell="{ text, column }">
            <template v-if="column.dataIndex === 'opera'">
              <template v-if="table.operaStyle === 'button'">
                <a-button v-if="table.operable.includes('可编辑')" size="small" class="mb-5">
                  编辑
                </a-button>
                <a-button v-if="table.operable.includes('可删除')" size="small" danger>
                  删除
                </a-button>
              </template>
              <template v-else>
                <a v-if="table.operable.includes('可编辑')" class="mr-5">编辑</a>
                <a v-if="table.operable.includes('可删除')" style="color: #ff4d4f">删除</a>
              </template>
            </template>
            <span
              v-else
              :style="{
                color: cells[column.dataIndex].color
              }"
            >
              {{
                cells[column.dataIndex].prefix && !text.startsWith(cells[column.dataIndex].prefix)
                  ? cells[column.dataIndex].prefix
                  : ''
              }}{{ text
              }}{{
                cells[column.dataIndex].suffix && !endsWith(text, cells[column.dataIndex].suffix)
                  ? cells[column.dataIndex].suffix
                  : ''
              }}
            </span>
          </template>
        </a-table>
        <DemoForm :emitter="fmEmitter" />
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Column from '@/types/column'
import { skipIgnores, endsWith } from '@/utils'
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import Table from '@/types/table'
import Model from '@/types/model'
import { BorderlessTableOutlined } from '@ant-design/icons-vue'
import DemoForm from '../components/DemoForm.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export default defineComponent({
  name: 'Demo',
  components: {
    BorderlessTableOutlined,
    DemoForm
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const model = computed(() => store.getters['model/ins'] as Model)
    const columns = computed(() => {
      const ret = store.getters['model/columns'].map((column: Column) =>
        skipIgnores(column, ['slots'])
      )
      const table = store.getters['model/table'] as Table
      if (table.operable.includes('可编辑') || table.operable.includes('可删除')) {
        return ret.concat(
          skipIgnores(new Column('操作', 'opera', { key: 'opera', width: 100 }), ['slots'])
        ) as Column[]
      } else {
        return ret as Column[]
      }
    })
    const table = computed(() => store.getters['model/table'] as Table)
    const cells = computed(() => (store.getters['model/table'] as Table).cells)
    const records = reactive([] as any[])
    const useRealData = ref(true)
    const fmEmitter = new Emitter()

    onMounted(onRefresh)

    async function onRefresh() {
      await store.dispatch('model/refresh', { reqDataset: useRealData.value })
      records.splice(0, records.length)
      records.push(...store.getters['model/records'](useRealData.value))
    }
    return {
      router,
      model,
      columns,
      table,
      cells,
      records,
      useRealData,
      fmEmitter,

      onRefresh,
      endsWith
    }
  }
})
</script>
