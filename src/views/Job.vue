<template>
  <LytService :active="`project/${pid}/model/${mid}/jobs`">
    <EditableTable
      title="接口"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Service.copy"
      :emitter="emitter"
      @save="refresh"
      @delete="refresh"
    />
  </LytService>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import LytService from '@/layouts/LytService.vue'
import { useRoute } from 'vue-router'
import EditableTable from '../components/com/EditableTable.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Service from '../types/service'
import { jobAPI as api } from '../apis'
import { columns, mapper } from './Job'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Jobs',
  components: {
    LytService,
    EditableTable
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const mid = route.params.mid
    const emitter = new Emitter()

    onMounted(refresh)

    async function refresh() {
      await store.dispatch('model/refresh')
    }
    return {
      Service,

      pid,
      mid,
      api,
      emitter,
      columns,
      mapper,

      refresh
    }
  }
})
</script>
