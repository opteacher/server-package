<script lang="ts" setup>
import { svcAPI as api } from '@/apis'
import store from '@/store'
import Model from '@/types/model'
import Service, { EmitType, Method, emitMapper, mthdClrs } from '@/types/service'
import { newOne } from '@/utils'
import { EditOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import Mapper from '@lib/types/mapper'
import { Modal } from 'ant-design-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, createVNode, defineProps, reactive } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  emitter: { type: Emitter, required: true },
  mapper: { type: Mapper, required: true },
  columns: { type: Array, required: true },
  model: { type: String, default: '' }
})
const pid = computed(() => store.getters['project/ins'].key)
const pstatus = computed(() => store.getters['project/ins'].status.stat)
const impDlg = reactive({
  emitter: new Emitter(),
  mapper: new Mapper({
    impFile: {
      label: '上传流程文件',
      type: 'UploadFile',
      path: '/server-package/api/v1/temp/file'
    },
    svcId: {
      label: '服务ID',
      type: 'Unknown',
      display: false
    }
  })
})
const router = useRouter()

function onAddSvcClicked() {
  props.emitter.emit('update:data', Service.copy({ name: props.model }))
  const models = store.getters['project/ins'].models
  props.emitter.emit('update:mprop', {
    'name.options': models.map((model: Model) => ({
      label: model.name,
      value: model.name
    })),
    'model.options': models.map((model: Model) => ({
      label: model.name,
      value: model.name
    }))
  })
}
function onBefSave(svc: Service) {
  if (svc.emit === 'timeout' || svc.emit === 'interval') {
    svc.path = `/job/v1/${svc.name}/${svc.interface}`
  }
}
function onImpFlowSubmit(params: { svcId: string; impFile: string[] }) {
  Modal.confirm({
    title: '确定上传流程？',
    icon: createVNode(ExclamationCircleOutlined),
    content: createVNode('div', undefined, '上传流程会清空原有逻辑，请确认后再上传'),
    onOk: async () => {
      await api.flow.import(params.svcId, { impFile: params.impFile[0] })
      impDlg.emitter.emit('update:visible', false)
      router.push(`/project/${pid.value}/flow/${params.svcId}`)
    }
  })
}
</script>

<template>
  <div>
    <EditableTable
      title="服务"
      description="定义在项目services文件夹下"
      size="small"
      :api="api"
      :filter="(svc: any) => model ? (svc.model === model) : !svc.model"
      :mapper="mapper"
      :columns="columns"
      :new-fun="() => newOne(Service)"
      :emitter="emitter"
      @add="onAddSvcClicked"
      @before-save="onBefSave"
      @save="() => emitter.emit('refresh')"
      @delete="() => emitter.emit('refresh')"
    >
      <template #emit="{ record: svc }">
        {{ emitMapper[svc.emit as EmitType] }}
      </template>
      <template #pathCond="{ record: svc }">
        <template v-if="svc.emit === 'api'">{{ svc.path }}</template>
        <template v-else-if="svc.emit === 'timeout'">{{ svc.condition }}后</template>
        <template v-else-if="svc.emit === 'interval'">每{{ svc.condition }}</template>
        <template v-else>-</template>
      </template>
      <template #fileFunc="{ record: svc }">
        <template v-if="!svc.model">{{ svc.name }}.{{ svc.interface }}()</template>
        <template v-else>-</template>
      </template>
      <template #opera="{ record: svc }">
        <template v-if="!svc.model">
          <a-input-group compact class="w-32">
            <a-button
              class="w-1/2"
              size="small"
              @click.stop="
                () =>
                  impDlg.emitter.emit('update:visible', {
                    show: true,
                    object: { svcId: svc.key, impFile: [] }
                  })
              "
            >
              导入
            </a-button>
            <a-button class="w-1/2" size="small" @click.stop="() => api.flow.export(svc.key)">
              导出
            </a-button>
          </a-input-group>
          <a-button
            type="primary"
            size="small"
            @click.stop="$router.push(`/project/${pid}/flow/${svc.key}`)"
          >
            <template #icon><edit-outlined /></template>
            设计流程
          </a-button>
        </template>
        <template v-else>
          <InfoCircleOutlined />
          模型路由流程固定
        </template>
      </template>
      <template #methodCtrl="{ record: svc }">
        <template v-if="svc.emit === 'api'">
          <a-tag :color="mthdClrs[svc.method as Method]">
            {{ svc.method }}
          </a-tag>
        </template>
        <template v-else-if="svc.emit === 'timeout' || svc.emit === 'interval'">
          <a-space align="center">
            <a-tooltip>
              <template #title>需先启动项目后才能启动任务！</template>
              <a-button
                size="small"
                type="primary"
                :disabled="pstatus !== 'running'"
                @click.stop="() => api.job.restart(svc.key).then(() => emitter.emit('refresh'))"
              >
                启动
              </a-button>
            </a-tooltip>
            <a-button
              v-if="svc.jobId"
              size="small"
              danger
              :disabled="pstatus !== 'running'"
              @click.stop="() => api.job.stop(svc.key).then(() => emitter.emit('refresh'))"
            >
              停止
            </a-button>
          </a-space>
        </template>
        <template v-else>-</template>
      </template>
      <template #stcVars="{ record: svc }">
        <ul class="list-none mb-0 pl-0">
          <li v-for="v of svc.stcVars" :key="v.key">{{ v.name }}</li>
        </ul>
      </template>
      <template #desc="{ record: svc }">
        <pre v-if="svc.desc" class="max-w-xs">{{ svc.desc }}</pre>
        <template v-else>-</template>
      </template>
    </EditableTable>
    <FormDialog
      title="导入流程"
      width="30vw"
      :newFun="() => ({ impFile: [] })"
      :mapper="impDlg.mapper"
      :emitter="impDlg.emitter"
      @submit="onImpFlowSubmit"
    />
  </div>
</template>
