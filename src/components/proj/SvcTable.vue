<script lang="ts" setup>
import { svcAPI as api } from '@/apis'
import store from '@/store'
import Model from '@/types/model'
import Service, {
  EmitType,
  Method,
  emitMapper,
  itvlDimen,
  mthdClrs,
  weekDays
} from '@/types/service'
import { newOne } from '@/utils'
import {
  EditOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  ImportOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import Mapper from '@lib/types/mapper'
import { Modal } from 'ant-design-vue'
import dayjs from 'dayjs'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, createVNode, defineProps, h, reactive } from 'vue'
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
  if (svc.emit === 'timeout') {
    svc.path = `/job/v1/${svc.name}/${svc.interface}`
    svc.condition = svc.interval.datetime.format('YYYY/MM/DDTHH:mm:ss')
  } else if (svc.emit === 'interval') {
    svc.path = `/job/v1/${svc.name}/${svc.interface}`
    switch (svc.interval.dimen) {
      case 's':
        svc.condition = ['*/' + svc.interval.value, '* * * * ?'].join(' ')
        break
      case 'm':
        svc.condition = [svc.interval.datetime.second(), '*/' + svc.interval.value, '* * * ?'].join(
          ' '
        )
        break
      case 'H':
        svc.condition = [
          svc.interval.datetime.second(),
          svc.interval.datetime.minute(),
          '*/' + svc.interval.value,
          '* * ?'
        ].join(' ')
        break
      case 'D':
        svc.condition = [
          svc.interval.datetime.second(),
          svc.interval.datetime.minute(),
          svc.interval.datetime.hour(),
          '*/' + svc.interval.value,
          '* ?'
        ].join(' ')
        break
      case 'W':
        svc.condition = [
          svc.interval.datetime.second(),
          svc.interval.datetime.minute(),
          svc.interval.datetime.hour(),
          '? *',
          svc.interval.value
        ].join(' ')
        break
      case 'M':
        svc.condition = [
          svc.interval.datetime.second(),
          svc.interval.datetime.minute(),
          svc.interval.datetime.hour(),
          svc.interval.datetime.daysInMonth(),
          `*/${svc.interval.value} ?`
        ].join(' ')
        break
    }
    console.log(svc.condition)
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
async function onDsgnFlowClick(selKey: 'design' | 'export' | 'import', svc: Service) {
  switch (selKey) {
    case 'design':
      await router.push(`/project/${pid.value}/flow/${svc.key}`)
      break
    case 'export':
      await api.flow.export(svc.key)
      break
    case 'import':
      impDlg.emitter.emit('update:visible', {
        show: true,
        object: { svcId: svc.key, impFile: [] }
      })
      break
  }
}
function getTimeFormat(svc: Service) {
  switch (svc.interval.dimen) {
    case 'm':
      return 'ss秒'
    case 'H':
      return 'mm分ss秒'
    case 'D':
      return 'HH时mm分ss秒'
    case 'W':
      return 'HH时mm分ss秒'
  }
}
</script>

<template>
  <div>
    <EditableTable
      title="服务"
      description="定义在项目services文件夹下"
      size="small"
      dlg-width="60vw"
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
        <template v-else-if="svc.emit === 'timeout'">
          {{ dayjs(svc.condition, 'YYYY/MM/DDTHH:mm:ss').format('YY/MM/DD HH:mm:ss') }}
        </template>
        <template v-else-if="svc.emit === 'interval'">{{ svc.condition }}</template>
        <template v-else>-</template>
      </template>
      <template #fileFunc="{ record: svc }">
        <template v-if="!svc.model">{{ svc.name }}.{{ svc.interface }}()</template>
        <template v-else>-</template>
      </template>
      <template #operaAfter="{ record: svc }">
        <a-popover v-if="!svc.model" overlayClassName="popmu-p-0" trigger="click">
          <template #content>
            <a-menu mode="vertical" @click="({ key }) => onDsgnFlowClick(key, svc)">
              <a-menu-item key="design">
                <template #icon><EditOutlined /></template>
                <span>设计</span>
              </a-menu-item>
              <a-divider class="my-0" />
              <a-menu-item key="export">
                <template #icon><ExportOutlined /></template>
                <span>导出</span>
              </a-menu-item>
              <a-menu-item key="import">
                <template #icon><ImportOutlined /></template>
                <span>导入</span>
              </a-menu-item>
            </a-menu>
          </template>
          <a-button type="text" size="small" @click.stop>更多</a-button>
        </a-popover>
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
      <template #conditionEDT="{ editing: svc }">
        <template v-if="svc.emit === 'interval'">
          <a-form-item-rest>
            <div class="flex leading-8 align-middle space-x-2">
              <span>每</span>
              <a-input-number
                class="w-14"
                placeholder="输入间隔时间"
                v-model:value="svc.interval.value"
              />
              <a-select
                class="w-24"
                placeholder="选择时间单位"
                :options="itvlDimen"
                v-model:value="svc.interval.dimen"
              />
              <span v-if="svc.interval.dimen !== 's'">在</span>
              <a-time-picker
                v-if="
                  svc.interval.dimen === 'm' ||
                  svc.interval.dimen === 'H' ||
                  svc.interval.dimen === 'D'
                "
                :show-now="false"
                :format="getTimeFormat(svc)"
                placeholder="指定时间"
                v-model:value="svc.interval.datetime"
              />
              <template v-else-if="svc.interval.dimen === 'W'">
                <a-select class="w-28" placeholder="指定周几" :options="weekDays" />
                <a-time-picker
                  :show-now="false"
                  placeholder="指定时间"
                  :format="getTimeFormat(svc)"
                  v-model:value="svc.interval.datetime"
                />
              </template>
              <a-date-picker
                v-else-if="svc.interval.dimen === 'M'"
                show-time
                placeholder="指定时间"
                v-model:value="svc.interval.datetime"
              />
              <span>执行一次，并立即执行</span>
              <a-checkbox v-model:checked="svc.interval.rightnow" />
            </div>
          </a-form-item-rest>
        </template>
        <template v-else-if="svc.emit === 'timeout'">
          <a-date-picker
            class="w-full"
            show-time
            placeholder="选择指定时间执行"
            v-model:value="svc.interval.datetime"
          />
        </template>
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
