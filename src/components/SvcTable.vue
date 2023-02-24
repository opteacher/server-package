<script lang="ts">
import { computed, defineComponent } from 'vue'
import EditableTable from '@lib/components/EditableTable.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Service, { EmitType, emitMapper } from '@/types/service'
import store from '@/store'
import { svcAPI as api } from '@/apis'
import { EditOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import Mapper from '@lib/types/mapper'

export default defineComponent({
  components: {
    EditableTable,
    EditOutlined,
    InfoCircleOutlined
  },
  props: {
    emitter: { type: Emitter, default: new Emitter() },
    mapper: { type: Mapper, required: true },
    columns: { type: Array, required: true },
    model: { type: String, default: '' }
  },
  setup(props) {
    const pid = computed(() => store.getters['project/ins'].key)
    const project = computed(() => store.getters['project/ins'])
    const pstatus = computed(() => store.getters['project/ins'].status.stat)

    function onAddSvcClicked(mname: string) {
      props.emitter.emit('update:data', { name: mname })
    }
    function onBefSave(mname: string, svc: Service) {
      if (svc.emit === 'timeout' || svc.emit === 'interval') {
        svc.path = `/job/v1/${mname}/${svc.interface}`
      }
    }
    return {
      Service,

      api,
      pid,
      project,
      pstatus,
      emitMapper,

      onAddSvcClicked,
      onBefSave
    }
  }
})
</script>

<template>
  <EditableTable
    title="服务"
    size="small"
    :api="api"
    :filter="(svc: any) => model ? svc.model === model : true"
    :mapper="mapper"
    :columns="columns"
    :copy="Service.copy"
    :emitter="emitter"
    @add="onAddSvcClicked"
    @before-save="onBefSave"
    @save="emitter.emit('refresh')"
    @delete="emitter.emit('refresh')"
  >
    <template #emit="{ record: svc }">
      {{ emitMapper[svc.emit as EmitType] }}
    </template>
    <template #pathCond="{ record: svc }">
      <template v-if="svc.emit === 'api'">
        {{ svc.path }}
      </template>
      <template v-else-if="svc.emit === 'timeout'">{{ svc.condition }}后</template>
      <template v-else-if="svc.emit === 'interval'">每{{ svc.condition }}</template>
      <template v-else>-</template>
    </template>
    <template #fileFunc="{ record: svc }">
      <template v-if="!svc.model">{{ svc.name }}.{{ svc.interface }}()</template>
      <template v-else>-</template>
    </template>
    <template #flow="{ record: svc }">
      <a-button
        v-if="!svc.model"
        type="primary"
        size="small"
        @click.stop="$router.push(`/server-package/project/${pid}/flow/${svc.key}`)"
      >
        <template #icon><edit-outlined /></template>
        &nbsp;设计流程
      </a-button>
      <template v-else>
        <InfoCircleOutlined />
        模型路由流程固定
      </template>
    </template>
    <template #methodCtrl="{ record: svc }">
      <template v-if="svc.emit === 'api'">
        {{ svc.method }}
      </template>
      <template v-else-if="svc.emit === 'timeout' || svc.emit === 'interval'">
        <a-space align="center">
          <a-tooltip>
            <template #title>需先启动项目后才能启动任务！</template>
            <a-button
              class="mb-3"
              size="small"
              type="primary"
              :disabled="pstatus !== 'running'"
              @click.stop="() => api.job.restart(svc.key)"
            >
              启动
            </a-button>
          </a-tooltip>
          <a-button
            v-if="svc.jobId"
            size="small"
            danger
            :disabled="pstatus !== 'running'"
            @click.stop="() => api.job.stop(svc.key)"
          >
            停止
          </a-button>
        </a-space>
      </template>
      <template v-else>-</template>
    </template>
    <template #desc="{ record: svc }">
      <a-tooltip v-if="svc.desc">
        <template #title>{{ svc.desc }}</template>
        <a-button type="link" size="small" click.stop="e => e.preventDefault()">
          <template #icon><info-circle-outlined /></template>
        </a-button>
      </a-tooltip>
      <template v-else>-</template>
    </template>
  </EditableTable>
</template>
