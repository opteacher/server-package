<template>
  <LytMain active="component" ref="layout">
    <EditableTable
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Compo.copy"
      :emitter="emitter"
      :scl-height="ctnrHeight"
      title="组件"
    />
  </LytMain>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import LytMain from '../layouts/LytMain.vue'
import EditableTable from '../components/com/EditableTable.vue'
import { columns, mapper } from './Compo'
import Compo from '../types/compo'
import { cmpAPI as api } from '../apis'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export default defineComponent({
  name: 'Component',
  components: {
    LytMain,
    EditableTable
  },
  setup() {
    const emitter = new Emitter()
    const layout = ref()
    const ctnrHeight = computed(() => (layout.value ? layout.value.container.clientHeight : 300))
    return {
      Compo,

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
