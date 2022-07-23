<template>
  <LytService :active="`project/${pid}/model/${mid}/jobs`">
    <EditableTable
      title="任务"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Service.copy"
      :emitter="emitter"
      @add="onAddClicked"
      @before-save="onBefSave"
      @save="refresh"
      @delete="refresh"
      @refresh="filterJob"
    >
      <template #emit="{ record: svc }">
        <template v-if="svc.emit === 'timeout'">延时</template>
        <template v-else-if="svc.emit === 'interval'">定时</template>
      </template>
      <template #flow="{ record: svc }">
        <a-button
          v-if="!svc.isModel"
          type="primary"
          size="small"
          @click.stop="$router.push(`/server-package/project/${pid}/model/${mid}/flow/${svc.key}`)"
        >
          <template #icon><edit-outlined /></template>
          &nbsp;设计流程
        </a-button>
        <a-tooltip v-else>
          <template #title>模型路由流程固定</template>
          <InfoCircleOutlined />
        </a-tooltip>
      </template>
      <template #ctrl="{ record: svc }">
        <template v-if="svc.emit === 'timeout' || svc.emit === 'interval'">
          <ul class="unstyled-list">
            <li class="mb-3">
              <a-tooltip>
                <template #title>需先启动项目后才能启动任务！</template>
                <a-button
                  size="small"
                  type="primary"
                  :disabled="pstatus !== 'running'"
                  @click.stop="api.job.restart(svc.key)"
                >
                  启动
                </a-button>
              </a-tooltip>
            </li>
            <li v-if="svc.jobId">
              <a-button
                size="small"
                danger
                :disabled="pstatus !== 'running'"
                @click.stop="api.job.stop(svc.key)"
              >
                停止
              </a-button>
            </li>
          </ul>
        </template>
      </template>
    </EditableTable>
  </LytService>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue'
import LytService from '@/layouts/LytService.vue'
import { useRoute } from 'vue-router'
import EditableTable from '../components/com/EditableTable.vue'
import Service from '../types/service'
import { svcAPI as api } from '../apis'
import { columns, emitter, mapper } from './Job'
import { useStore } from 'vuex'
import { InfoCircleOutlined, EditOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'Jobs',
  components: {
    LytService,
    EditableTable,
    InfoCircleOutlined,
    EditOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const mid = route.params.mid
    const mname = computed(() => store.getters['model/ins'].name)
    const pstatus = computed(() => store.getters['project/ins'].status.stat)

    onMounted(refresh)

    async function refresh() {
      await store.dispatch('model/refresh')
    }
    function filterJob(svcs: any[], callback: (data: any) => void) {
      callback(svcs.filter((svc: any) => svc.emit === 'timeout' || svc.emit === 'interval'))
    }
    function onAddClicked() {
      emitter.emit('update:data', { name: mname.value, emit: 'timeout' })
    }
    function onBefSave(svc: Service) {
      svc.path = `/job/v1/${mname.value}/${svc.interface}`
    }
    return {
      Service,

      pid,
      mid,
      api,
      emitter,
      columns,
      mapper,
      pstatus,

      refresh,
      filterJob,
      onAddClicked,
      onBefSave
    }
  }
})
</script>
