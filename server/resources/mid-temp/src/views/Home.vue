<template>
  <IndexLayout @change="onMuItmChange">
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
          @click="fmEmitter.emit('update:show', { show: true })"
        >
          添加
        </a-button>
      </a-col>
    </a-row>
    <a-table
      :columns="table.columns"
      :data-source="records"
      :size="table.size"
      :rowClassName="() => 'white-bkgd'"
      :pagination="table.hasPages"
      bordered
      :custom-row="
        (record: any) => ({
          onClick: () => onRecordClick(record)
        })
      "
    >
      <template #bodyCell="{ text, column, record }">
        <template v-if="column.dataIndex === 'opera'">
          <template v-if="table.operaStyle === 'button'">
            <a-button
              v-if="table.operable.includes('可编辑')"
              size="small"
              class="mb-5"
              @click="fmEmitter.emit('update:show', { show: true, record })"
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
              <a-button size="small" danger @click.stop="(e: any) => e.preventDefault()">
                删除
              </a-button>
            </a-popconfirm>
          </template>
          <template v-else>
            <a
              v-if="table.operable.includes('可编辑')"
              class="mr-5"
              @click="fmEmitter.emit('update:show', { show: true, record })"
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
            color: table.cells[column.dataIndex].color
          }"
        >
          {{
            table.cells[column.dataIndex].prefix &&
            !text.startsWith(table.cells[column.dataIndex].prefix)
              ? table.cells[column.dataIndex].prefix
              : ''
          }}{{ text
          }}{{
            table.cells[column.dataIndex].suffix &&
            !endsWith(text, table.cells[column.dataIndex].suffix)
              ? table.cells[column.dataIndex].suffix
              : ''
          }}
        </span>
      </template>
    </a-table>
    <!-- <DemoForm :emitter="fmEmitter" @submit="onRecordSave" /> -->
  </IndexLayout>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref } from 'vue'
import IndexLayout from '../layout/index.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Table from '../types/table'
import { endsWith } from '../utils'
import api from '../api'

const models: any[] = [] /*return models.map(model => JSON.stringify(model)).join(',\n  ')*/

export default defineComponent({
  name: 'Home',
  components: {
    IndexLayout
  },
  setup() {
    const actMdl = ref('')
    const table = reactive(new Table())
    const records = reactive([] as any[])
    const fmEmitter = new Emitter()

    async function refresh() {
      if (!actMdl.value) {
        return
      }
      const model = models.find((mdl: any) => mdl.name === actMdl.value)
      Table.copy(model.table, table)
      records.splice(0, records.length, ...(await api.all(actMdl.value)))
    }
    function onRecordSave(record: any, next: () => void) {
      console.log(record)
      next()
    }
    function onRecordDel(record: any) {
      console.log(record)
    }
    function onRecordClick(record: any) {
      fmEmitter.emit('viewOnly', true)
      fmEmitter.emit('update:show', { show: true, record })
    }
    async function onMuItmChange(mname: string) {
      actMdl.value = mname
      await refresh()
    }
    return {
      table,
      records,
      fmEmitter,

      endsWith,
      onRecordSave,
      onRecordDel,
      onRecordClick,
      onMuItmChange
    }
  }
})
</script>
