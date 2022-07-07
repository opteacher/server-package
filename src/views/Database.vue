<template>
  <LytMain active="database" ref="layout">
    <EditableTable
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Database.copy"
      :emitter="emitter"
      :scl-height="ctnrHeight"
      title="数据库"
    />
  </LytMain>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import LytMain from '../layouts/LytMain.vue'
import EditableTable from '@/components/com/EditableTable.vue'
import Database from '../types/database'
import { columns, mapper } from './Database'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { dbAPI as api } from '../apis'

export default defineComponent({
  name: 'Database',
  components: {
    LytMain,
    EditableTable
  },
  setup() {
    const emitter = new Emitter()
    const layout = ref()
    const ctnrHeight = computed(() => (layout.value ? layout.value.container.clientHeight : 300))

    return {
      Database,

      api,
      columns,
      mapper,
      emitter,
      layout,
      ctnrHeight
    }
  }
})
</script>
