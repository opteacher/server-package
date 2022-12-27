<template>
  <LytMain active="database">
    <EditableTable
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Database.copy"
      :emitter="emitter"
      title="数据库"
    />
  </LytMain>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import LytMain from '../layouts/LytMain.vue'
import Database from '../types/database'
import { columns, mapper } from './Database'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { dbAPI as api } from '../apis'

export default defineComponent({
  name: 'Database',
  components: {
    LytMain
  },
  setup() {
    const emitter = new Emitter()

    return {
      Database,

      api,
      columns,
      mapper,
      emitter
    }
  }
})
</script>
