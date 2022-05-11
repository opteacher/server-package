<template>
  <LytMain active="database">
    <EditableTable
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Database.copy"
      :emitter="emitter"
      title="项目"
    />
  </LytMain>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import LytMain from '../layouts/LytMain.vue'
import EditableTable from '@/components/com/EditableTable.vue'
import Database from '../types/database'
import { api, columns, mapper, emitter } from './Database'

export default defineComponent({
  name: 'Database',
  components: {
    LytMain,
    EditableTable
  },
  setup() {
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
