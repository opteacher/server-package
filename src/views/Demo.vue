<template>
  <LytDesign :active="`/project/${pid}/model/${mid}/demo`">
    <div class="w-full text-right">
      <a-switch
        v-model:checked="useRealData"
        checked-children="真实"
        un-checked-children="模板"
        @change="refresh"
      />
      &nbsp;数据
    </div>
    <a-divider />
    <EditableTable
      :api="{ all: () => records }"
      sclHeight="h-full"
      :columns="columns"
      :mapper="formDialog.mapper"
      :copy="copyRecord"
      :emitter="formDialog.emitter"
      :size="table.size"
      :pagable="table.hasPages"
      :refOptions="table.refresh"
      :dspCols="table.colDspable"
      :editable="table.operable.includes('可编辑')"
      :addable="table.operable.includes('可增加')"
      :delable="table.operable.includes('可删除')"
    />
  </LytDesign>
</template>

<script lang="ts" setup name="Demo">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseTypes } from '@/types'
import Form from '@/types/form'
import Model from '@/types/model'
import Table from '@/types/table'
import { pickOrIgnore } from '@/utils'
import Column from '@lib/types/column'
import Field from '@lib/types/field'
import Mapper, { createByFields } from '@lib/types/mapper'
import dayjs, { Dayjs } from 'dayjs'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'

import LytDesign from '../layouts/LytDesign.vue'
import { useRoute } from 'vue-router'

const store = useStore()
const route = useRoute()
const pid = route.params.pid
const mid = route.params.mid
const model = computed<Model>(() => store.getters['model/ins'] as Model)
const columns = computed<Column[]>(() =>
  store.getters['model/columns']
    .map((column: Column) => pickOrIgnore(column, ['slots']))
    .filter((column: Column) => !column.notDisplay)
)
const form = computed<Form>(() => store.getters['model/form'] as Form)
const fields = computed<Field[]>(() => store.getters['model/fields'] as Field[])
const table = computed<Table>(() => store.getters['model/table'] as Table)
const records = computed(() => store.getters['model/records'](useRealData.value))
const useRealData = ref(false)
const formDialog = reactive({
  visible: false,
  emitter: new Emitter(),
  mapper: new Mapper({})
})

onMounted(refresh)

async function refresh() {
  await store.dispatch('model/refresh', { reqDataset: useRealData.value })
  formDialog.emitter.emit('update:mapper', createByFields(fields.value))
}
function copyRecord(src: any, tgt?: any, force = false) {
  const props = model.value.props
  tgt = tgt || Object.fromEntries(props.map(prop => [prop.name, toDefault(prop.ptype)]))
  tgt.key = force ? src.key || src._id || src.id : src.key || src._id || src.id || tgt.key
  for (const prop of props) {
    switch (prop.ptype) {
      case 'Boolean':
        tgt[prop.name] = force
          ? src[prop.name]
          : typeof src[prop.name] !== 'undefined'
          ? src[prop.name]
          : tgt[prop.name]
        break
      case 'DateTime':
        tgt[prop.name] = src[prop.name] ? dayjs(src[prop.name]) : force ? dayjs() : tgt[prop.name]
        break
      case 'Array':
        tgt[prop.name] =
          src[prop.name] && src[prop.name].length ? src[prop.name] : force ? [] : tgt[prop.name]
        break
      default:
        tgt[prop.name] = force ? src[prop.name] : src[prop.name] || tgt[prop.name]
    }
  }
  return tgt
}
function toDefault(type: BaseTypes) {
  switch (type) {
    case 'String':
    case 'LongStr':
      return ''
    case 'Number':
      return 0
    case 'DateTime':
      return ref<Dayjs>()
    case 'Boolean':
      return false
    case 'Array':
      return []
    case 'Object':
      return {}
    case 'Any':
    case 'Unknown':
      return undefined
  }
}
</script>
