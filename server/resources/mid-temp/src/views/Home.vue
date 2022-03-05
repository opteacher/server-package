<template>
  <a-layout class="h-100">
    <a-layout-header>Header</a-layout-header>
    <a-layout>
      <a-layout-sider><NaviSideBar /></a-layout-sider>
      <a-layout-content class="pl-20 ptb-10 pr-10">
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
              @click="emitter.emit('update:show', { show: true })"
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
          <template #bodyCell="{ text, column, record }">
            <template v-if="column.dataIndex === 'opera'">
              <template v-if="table.operaStyle === 'button'">
                <a-button
                  v-if="table.operable.includes('可编辑')"
                  size="small"
                  class="mb-5"
                  @click="emitter.emit('update:show', { show: true, record })"
                >
                  编辑
                </a-button>
                <a-popconfirm
                  v-if="table.operable.includes('可删除')"
                  title="确定删除该记录吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="onRecordDel(record)"
                >
                  <a-button size="small" danger @click.stop="e => e.preventDefault()">
                    删除
                  </a-button>
                </a-popconfirm>
              </template>
              <template v-else>
                <a
                  v-if="table.operable.includes('可编辑')"
                  class="mr-5"
                  @click="emitter.emit('update:show', { show: true, record })"
                >
                  编辑
                </a>
                <a-popconfirm
                  v-if="table.operable.includes('可删除')"
                  title="确定删除该记录吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="onRecordDel(record)"
                >
                  <a style="color: #ff4d4f">删除</a>
                </a-popconfirm>
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
        <DemoForm :emitter="emitter" @submit="onRecordSave" />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script>
import { defineComponent, onMounted, computed } from 'vue'
import NaviSideBar from '@/components/NaviSideBar.vue'
import FormDialog from '@/components/FormDialog.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Table from '../types/table'

export default defineComponent({
  name: 'Home',
  components: {
    NaviSideBar,
    FormDialog
  },
  setup() {
    const emitter = new Emitter()
    const table = computed(() => new Table())
    return {
      table,
      emitter
    }
  }
})
</script>
