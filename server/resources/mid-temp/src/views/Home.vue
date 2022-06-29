<template>
  <IndexLayout @change="onMuItmChange">
    <a-row class="mb-10" type="flex">
      <a-col flex="auto">
        <a-space>
          <h3 class="mb-0">{{ table.title }}</h3>
          <span style="color: rgba(0, 0, 0, 0.45)">{{ table.desc }}</span>
        </a-space>
      </a-col>
      <a-col v-if="table.operable.includes('可增加')" style="text-align: right" flex="100px">
        <a-button
          class="float-right"
          type="primary"
          @click="
            fmEmitter.emit('update:show', {
              show: true,
              cpyRcd: (tgt: any) => actCopy(actCopy({}), tgt, true)
            })
          "
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
      :custom-row="
        (record: any) => ({
          onClick: () => fmEmitter.emit('update:show', {
            show: true,
            cpyRcd: (tgt: any) => actCopy(record, tgt),
            viewOnly: true
          })
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
              @click.stop="
                fmEmitter.emit('update:show', {
                  show: true,
                  cpyRcd: (tgt: any) => actCopy(record, tgt)
                })
              "
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
              @click.stop="
                fmEmitter.emit('update:show', {
                  show: true,
                  cpyRcd: (tgt: any) => actCopy(record, tgt)
                })
              "
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
    <FormDialog :emitter="fmEmitter" :form="form" @submit="onRecordSave" />
  </IndexLayout>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import IndexLayout from '../layout/index.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Form from '../types/form'
import Table from '../types/table'
import { endsWith } from '../utils'
import api from '../api'
import FormDialog from '../components/FormDialog.vue'
import Column from '../types/column'
/*return models.map(model => `import ${model.name} from '../types/${model.name}'`).join('\n')*/

const models: any[] =
  [] /*return '[' + models.map(model => JSON.stringify(model)).join(',\n  ') + ']'*/

const copies: Record<string, (src: any, tgt?: any, force?: boolean) => any> =
  {} /*return '{ ' + models.map(model => `'${model.name}': ${model.name}.copy`).join(', ') + ' }'*/

export default defineComponent({
  name: 'Home',
  components: {
    IndexLayout,
    FormDialog
  },
  setup() {
    const actMdl = ref('')
    const actCopy = computed(() => copies[actMdl.value])
    const form = reactive(new Form())
    const table = reactive(new Table())
    const records = reactive([] as any[])
    const columns = computed(() =>
      table.columns
        .filter((column: Column) => !column.notDisplay)
        .concat(new Column('操作', 'opera', { width: 100 }))
    )
    const fmEmitter = new Emitter()

    async function refresh() {
      if (!actMdl.value) {
        return
      }
      const model = models.find((mdl: any) => mdl.name === actMdl.value)
      Form.copy(model.form, form, true)
      Table.copy(model.table, table, true)
      records.splice(
        0,
        records.length,
        ...(await api.all(actMdl.value)).map((record: any) => actCopy.value(record))
      )
    }
    async function onRecordSave(record: any, next: () => void) {
      if (record.key) {
        await api.update(actMdl.value, record.key, record)
      } else {
        await api.add(actMdl.value, record)
      }
      await refresh()
      next()
    }
    async function onRecordDel(record: any) {
      await api.remove(actMdl.value, record.key)
      await refresh()
    }
    async function onMuItmChange(mname: string) {
      actMdl.value = mname
      await refresh()
    }
    return {
      actMdl,
      actCopy,
      form,
      table,
      records,
      fmEmitter,
      columns,
      copies,

      endsWith,
      onRecordSave,
      onRecordDel,
      onMuItmChange
    }
  }
})
</script>

<style lang="less">
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

.mb-5 {
  margin-bottom: 5px !important;
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
