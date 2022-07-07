<template>
  <LytMain active="dependency" ref="layout">
    <EditableTable
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Dep.copy"
      :emitter="emitter"
      :scl-height="ctnrHeight"
      title="依赖"
    />
  </LytMain>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import LytMain from '../layouts/LytMain.vue'
import EditableTable from '../components/com/EditableTable.vue'
import { columns, mapper } from './Dep'
import Dep from '../types/dep'
import { depAPI as api } from '../apis'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export default defineComponent({
  name: 'Dependency',
  components: {
    LytMain,
    EditableTable
  },
  setup() {
    const emitter = new Emitter()
    const layout = ref()
    const ctnrHeight = computed(() => (layout.value ? layout.value.container.clientHeight : 300))
    return {
      Dep,

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
