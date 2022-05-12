<template>
  <LytService :active="`project/${pid}/model/${mid}/apis`">
    <EditableTable
      title="接口"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Service.copy"
      :emitter="emitter"
      @add="onAddClicked"
      @save="refresh"
      @delete="refresh"
      @refresh="filterAPI"
    >
      <template #isModel="{ record: svc }">
        {{ svc.isModel ? '是' : '否' }}
      </template>
      <template #flow="{ record: svc }">
        <a-button
          v-if="!svc.isModel"
          type="primary"
          size="small"
          @click="$router.push(`/server-package/project/${pid}/model/${mid}/flow/${svc.key}`)"
        >
          <template #icon><edit-outlined /></template>
          &nbsp;设计流程
        </a-button>
        <a-tooltip v-else>
          <template #title>模型路由流程固定</template>
          <InfoCircleOutlined />
        </a-tooltip>
      </template>
    </EditableTable>
  </LytService>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue'
import LytService from '@/layouts/LytService.vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import EditableTable from '../components/com/EditableTable.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Service from '../types/service'
import { svcAPI as api } from '../apis'
import { columns, mapper } from './API'
import { EditOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'APIs',
  components: {
    LytService,
    EditableTable,
    EditOutlined,
    InfoCircleOutlined
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
    function filterAPI(svcs: any[], callback: (data: any) => void) {
      callback(svcs.filter((svc: any) => svc.emit === 'api'))
    }
    function onAddClicked() {
      emitter.emit('update:data', { name: store.getters['model/ins'].name })
    }
    return {
      Service,

      pid,
      mid,
      api,
      emitter,
      columns,
      mapper,

      refresh,
      filterAPI,
      onAddClicked
    }
  }
})
</script>
