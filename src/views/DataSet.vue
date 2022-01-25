<template>
<DataTable>
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
</DataTable>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref } from 'vue'
import DataTable from '../layouts/DataTable.vue'
import EditableTable from '../components/com/EditableTable.vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Column, Mapper } from '@/common'

export default defineComponent({
  name: 'Dataset',
  components: {
    DataTable,
    EditableTable
  },
  setup () {
    const route = useRoute()
    const store = useStore()
    const columns = reactive([] as Column[])
    const mapper = reactive(new Mapper({}))
    const emitter = new Emitter()

    onMounted(refresh)

    async function refresh () {
      await store.dispatch('model/refresh', [
        route.params.pid, route.params.mid
      ])
      const model = store.getters['model/ins']
      columns.splice(0, columns.length)
      columns.push(...model.props.map((prop: any) => {
        return reactive(new Column(`${prop.label}(${prop.name})`, prop.name))
      }))
      for (const [key, val] of model.props.map((prop: any) => {
        return [prop.name, { type: 'Unknown' }]
      })) {
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
