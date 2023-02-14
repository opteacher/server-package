<template>
  <LytMain active="dependency">
    <EditableTable
      title="依赖"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Dep.copy"
      :emitter="emitter"
      sclHeight="h-full"
    />
  </LytMain>
</template>

<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue'
import LytMain from '../layouts/LytMain.vue'
import { columns, mapper } from './Dep'
import Dep from '../types/dep'
import { depAPI as api } from '../apis'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export default defineComponent({
  name: 'Dependency',
  components: {
    LytMain
  },
  setup() {
    const emitter = new Emitter()
    return {
      Dep,

      api,
      columns,
      mapper,
      emitter
    }
  }
})
</script>
