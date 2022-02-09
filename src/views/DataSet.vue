<template>
  <LytDataSet>
    <div class="text-right mt-10">
      <a-button @click="refresh">刷新</a-button>
    </div>
    <EditableTable
      class="mt-10"
      dsKey="model/dataset"
      :columns="columns"
      :mapper="mapper"
      :emitter="emitter"
      :edtable="false"
      :addable="false"
      :delable="false"
    />
  </LytDataSet>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, onMounted, reactive } from 'vue'
import LytDataSet from '../layouts/LytDataSet.vue'
import EditableTable from '../components/com/EditableTable.vue'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Column, Mapper } from '@/common'

export default defineComponent({
  name: 'Dataset',
  components: {
    LytDataSet,
    EditableTable
  },
  setup() {
    const store = useStore()
    const columns = reactive([] as Column[])
    const mapper = reactive(new Mapper())
    const emitter = new Emitter()

    onMounted(refresh)

    async function refresh() {
      await store.dispatch('model/refresh')
      const model = store.getters['model/ins']
      columns.splice(0, columns.length)
      columns.push(
        ...model.props.map((prop: any) =>
          reactive(new Column(`${prop.label}(${prop.name})`, prop.name))
        )
      )
      for (const [key, val] of model.props.map((prop: any) => [prop.name, { type: 'Unknown' }])) {
        mapper[key] = reactive(val)
      }
      emitter.emit('refresh')
    }
    return {
      columns,
      mapper,
      emitter,

      refresh
    }
  }
})
</script>
