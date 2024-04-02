<template>
  <LytProject :active="`/project/${pid}`">
    <a-page-header class="p-0 mb-10" :title="project.name" :sub-title="project.desc">
      <template #tags>
        <a-tooltip>
          <template #title>点击刷新状态</template>
          <a-tag v-if="project.status.stat === 'running'" color="#52c41a">
            <a @click="refresh">{{ project.status.stat }}</a>
          </a-tag>
          <a-tag v-else-if="project.status.stat === 'stopped'" color="#f5222d">
            <a @click="refresh">{{ project.status.stat }}</a>
          </a-tag>
          <a-tag v-else-if="project.status.stat === 'loading'" color="#faad14">
            <template #icon>
              <SyncOutlined :spin="true" />
            </template>
            <a @click="refresh">{{ project.status.stat }}</a>
          </a-tag>
        </a-tooltip>
        <a-tooltip v-if="project.status.stat !== 'stopped'">
          <template #title>查看日志</template>
          <a-button type="text" size="small" @click="() => setProp(ctnrLogs, 'visible', true)">
            <template #icon><FileTextOutlined /></template>
          </a-button>
        </a-tooltip>
        <a-modal
          width="60vw"
          :bodyStyle="{ height: '60vh' }"
          title="容器日志"
          :footer="null"
          v-model:open="ctnrLogs.visible"
        >
          <OptSclPnl :url="esURL" :emitter="ctnrLogs.emitter" />
        </a-modal>
      </template>
      <template #extra>
        <a-button v-if="isFront" @click="() => frtEmitter.emit('update:visible', true)">
          <template #icon><Html5Outlined /></template>
          &nbsp;前端配置
        </a-button>
        <FormDialog
          title="配置前端"
          :new-fun="() => newOne(Frontend)"
          :emitter="frtEmitter"
          :mapper="frtMapper"
          @submit="onConfigSbt"
        >
          <template #layout>
            <a-button>水电费水电费水电</a-button>
          </template>
        </FormDialog>
        <a-button
          v-if="isFront"
          type="primary"
          @click="() => frtEmitter.emit('update:visible', true)"
        >
          <template #icon><ant-design-outlined /></template>
          前端设计
        </a-button>
        <DkrRelBtns />
        <MidPubBtns />
        <PjtCtrlBtns @sync_fin="onSyncFinish" />
        <a-button @click="onConfigClick">
          <template #icon><SettingOutlined /></template>
        </a-button>
        <FormDialog
          title="配置项目"
          :new-fun="() => newOne(Project)"
          :emitter="pjtEmitter"
          :mapper="pjtMapper"
          @submit="onConfigSbt"
        />
      </template>
      <a-descriptions size="small" :column="4">
        <a-descriptions-item label="占用端口">{{ project.port }}</a-descriptions-item>
        <template v-if="!isFront">
          <a-descriptions-item label="数据库" :span="2">
            {{ database }}
          </a-descriptions-item>
          <a-descriptions-item label="启动时清空数据库">
            {{ project.dropDbs ? '是' : '否' }}
          </a-descriptions-item>
          <a-descriptions-item label="独立部署（不依赖server-package）">
            {{ project.independ ? '是' : '否' }}
          </a-descriptions-item>
          <a-descriptions-item v-if="project.commands" label="前置命令" :span="4">
            <a-typography-paragraph
              class="whitespace-pre-line"
              :ellipsis="{ rows: 2, expandable: true, symbol: 'more' }"
              :content="project.commands"
            />
          </a-descriptions-item>
        </template>
      </a-descriptions>
    </a-page-header>
    <a-tabs>
      <a-tab-pane key="model" tab="模型">
        <EditableTable
          title="模型"
          :description="`定义在项目${isFront ? 'types' : 'models'}文件夹下`"
          size="small"
          :api="mdlAPI"
          :columns="mdlColumns"
          :mapper="mdlMapper"
          :new-fun="() => newOne(Model)"
          :emitter="mdlEmitter"
          @save="refresh"
          @delete="refresh"
        >
          <template #name="{ record: model }">
            <a :href="`/server-package/project/${pid}/model/${model.key}`" @click.stop>
              {{ model.name }}
            </a>
          </template>
          <template #methods="{ record: model }">
            <a-tooltip v-for="svc in mSvcMapper[model.key]" :key="svc.key">
              <template #title>{{ svc.path }}</template>
              <a-tag class="cursor-pointer" :color="mthdClrs[svc.method]">
                {{ svc.method }}
              </a-tag>
            </a-tooltip>
          </template>
          <template #methodsEDT="{ editing: model }">
            <MsvcSelect
              :methods="model.methods"
              @update:methods="(mthds: Method[]) => setProp(model, 'methods', mthds)"
            />
          </template>
          <template #operaAfter="{ record: model }">
            <a-popover overlayClassName="popmu-p-0" trigger="click">
              <template #content>
                <a-menu mode="vertical" @click="({ key }) => onMdlOprClick(key, model)">
                  <a-menu-item key="design">
                    <template #icon><FormOutlined /></template>
                    <span>表单/表项设计</span>
                  </a-menu-item>
                  <a-divider class="my-0" />
                  <a-menu-item key="export">
                    <template #icon><ExportOutlined /></template>
                    <span>导出</span>
                  </a-menu-item>
                </a-menu>
              </template>
              <a-button type="text" size="small" @click.stop>更多</a-button>
            </a-popover>
          </template>
          <template #expandedRowRender="{ record: model }">
            <a-tabs v-model:activeKey="actMdlTab" type="card">
              <a-tab-pane key="struct" tab="结构">
                <EditableTable
                  title="字段"
                  size="small"
                  :api="{
                    all: () => model.props,
                    add: (data: any) =>
                      reqPost('model/' + model.key + '/property', data, { type: 'api' }).then(
                        refresh
                      ),
                    remove: (prop: any) =>
                      reqDelete('model/' + model.key, 'property/' + prop.key, { type: 'api' }).then(
                        refresh
                      ),
                    update: (data: any) =>
                      reqPut('model/' + model.key, 'property/' + data.key, data, {
                        type: 'api'
                      }).then(refresh)
                  }"
                  :columns="propColumns"
                  :mapper="propMapper"
                  :emitter="propEmitter"
                  :new-fun="() => newOne(Property)"
                  @save="refresh"
                  @delete="refresh"
                >
                  <template #relative="{ record }">
                    <partition-outlined
                      v-if="record.relative.isArray"
                      :rotate="record.relative.belong ? 180 : 0"
                    />
                    {{ record.relative.model }}
                  </template>
                  <template #relativeEDT="{ editing }">
                    <a-input-group>
                      <a-row :gutter="8" type="flex" justify="space-around" align="middle">
                        <a-col :span="4">
                          <a-form-item class="mb-0" ref="relative.belong" name="relative.belong">
                            <a-select
                              class="w-full"
                              :disabled="mdlOpns.length === 1"
                              :value="editing.relative.belong ? 'belong' : 'has'"
                              @change="
                                (val: string) => {
                                  editing.relative.belong = val === 'belong'
                                }
                              "
                            >
                              <a-select-option value="belong">属于</a-select-option>
                              <a-select-option value="has">拥有</a-select-option>
                            </a-select>
                          </a-form-item>
                        </a-col>
                        <a-col :span="4" class="text-center">
                          <a-form-item class="mb-0" ref="relative.isArray" name="relative.isArray">
                            <a-checkbox
                              :disabled="mdlOpns.length === 1"
                              v-model:checked="editing.relative.isArray"
                              @change="
                                (checked: boolean) => {
                                  editing.ptype = checked ? 'Array' : 'Id'
                                }
                              "
                            >
                              {{ editing.relative.isArray ? '多个' : '一个' }}
                            </a-checkbox>
                          </a-form-item>
                        </a-col>
                        <a-col :span="16">
                          <a-form-item class="mb-0" ref="relative.model" name="relative.model">
                            <a-select
                              class="w-full"
                              :disabled="mdlOpns.length === 1"
                              v-model:value="editing.relative.model"
                              :options="mdlOpns"
                              @change="(relMdl: string) => onRelMdlChange(editing, relMdl)"
                            />
                          </a-form-item>
                        </a-col>
                      </a-row>
                    </a-input-group>
                  </template>
                  <template #remark="{ record: mdl }">
                    <pre v-if="mdl.remark" class="max-w-xs">{{ mdl.remark }}</pre>
                    <template v-else>-</template>
                  </template>
                </EditableTable>
              </a-tab-pane>
              <a-tab-pane key="data" tab="数据" :disabled="project.status.stat !== 'running'">
                <EditableTable
                  :api="{ all: () => mdlAPI.dataset(model.key) }"
                  scl-height="h-full"
                  min-height="18rem"
                  :columns="
                    model.props.map((prop: any) =>
                      Column.copy({ title: prop.label, key: prop.name, dataIndex: prop.name })
                    )
                  "
                  :mapper="createByFields(model.form.fields)"
                  :new-fun="
                    () =>
                      Object.fromEntries(
                        model.props.map((prop: any) => [prop.name, bsTpDefault(prop.ptype)])
                      )
                  "
                  size="small"
                  :pagable="true"
                  :refOptions="['manual']"
                  :editable="true"
                  :addable="true"
                  :delable="true"
                />
              </a-tab-pane>
            </a-tabs>
          </template>
        </EditableTable>
        <FormDialog
          title="导出类"
          v-model:show="expClsVsb"
          :object="expClsObj"
          :new-fun="() => newOne(ExpCls)"
          :mapper="expMapper"
          @submit="onExpClsSbt"
        />
      </a-tab-pane>
      <a-tab-pane key="typo" tab="自定义类">
        <div class="text-right">
          <a-typography-text class="mr-3" type="secondary">
            点击方法进入方法流程设计
          </a-typography-text>
          <a-button type="primary" @click="() => clsEmitter.emit('update:visible', true)">
            添加
          </a-button>
        </div>
        <a-row class="w-full p-2" :gutter="{ lg: 16, xl: 24, xxl: 32 }">
          <a-col
            v-for="typo of project.typos"
            :key="typo.key"
            :lg="{ span: 12 }"
            :xl="{ span: 9 }"
            :xxl="{ span: 6 }"
          >
            <TypoCard :typo="typo" :emitter="clsEmitter" />
          </a-col>
        </a-row>
        <FormDialog
          title="自定义类"
          :emitter="clsEmitter"
          :mapper="clsMapper"
          :new-fun="() => newOne(Typo)"
          @submit="onTypoSubmit"
        />
      </a-tab-pane>
    </a-tabs>
    <SvcTable class="mt-10" :mapper="svcMapper" :columns="svcColumns" :emitter="svcEmitter" />
  </LytProject>
</template>

<script lang="ts" setup name="Project">
/* eslint-disable @typescript-eslint/no-explicit-any */
import DkrRelBtns from '@/components/proj/DkrRelBtns.vue'
import MidPubBtns from '@/components/proj/MidPubBtns.vue'
import MsvcSelect from '@/components/proj/MsvcSelect.vue'
import PjtCtrlBtns from '@/components/proj/PjtCtrlBtns.vue'
import SvcTable from '@/components/proj/SvcTable.vue'
import TypoCard from '@/components/proj/TypoCard.vue'
import OptSclPnl from '@/lib/frontend-library/src/components/OptSclPnl.vue'
import { OpnType, bsTpDefault } from '@/types'
import ExpCls from '@/types/expCls'
import Frontend from '@/types/frontend'
import Model from '@/types/model'
import Project from '@/types/project'
import Property from '@/types/property'
import Service, { Method, mthdClrs } from '@/types/service'
import Typo from '@/types/typo'
import { getDftPjt, newOne, reqDelete, reqPost, reqPut, setProp } from '@/utils'
import {
  AntDesignOutlined,
  ExportOutlined,
  FileTextOutlined,
  FormOutlined,
  Html5Outlined,
  PartitionOutlined,
  SettingOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'
import Column from '@lib/types/column'
import { createByFields } from '@lib/types/mapper'
import { TinyEmitter as Emitter, TinyEmitter } from 'tiny-emitter'
import { computed, h, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import { pjtAPI as api, mdlAPI, pjtAPI, typAPI } from '../apis'
import LytProject from '../layouts/LytProject.vue'
import { mapper as pjtMapper } from './Home'
import { emitter as pjtEmitter } from './Home'
import {
  expMapper,
  columns as mdlColumns,
  mapper as mdlMapper,
  propColumns,
  propEmitter,
  propMapper
} from './Model'
import {
  clsEmitter,
  clsMapper,
  frtEmitter,
  frtMapper,
  svcColumns,
  svcEmitter,
  svcMapper
} from './Project'
import Status from '@/types/status'

const route = useRoute()
const router = useRouter()
const store = useStore()
const pid = route.params.pid as string
const project = computed<Project>(() => store.getters['project/ins'])
const pjtStt = computed<Status>(() => store.getters['project/ins'].status)
const database = computed<string>(() => {
  const db = (store.getters['project/ins'] as Project).database
  return db ? `${db.dbtype}db://${db.host}:${db.port}/${db.db}` : ''
})
const isFront = computed<boolean>(() => !store.getters['project/ins'].database)
const mdlEmitter = new Emitter()
const mSvcMapper = computed<Record<string, Service[]>>(() => {
  const ret: Record<string, Service[]> = {}
  const pjt = store.getters['project/ins'] as Project
  for (const svc of pjt.services.filter(svc => svc.model)) {
    if (svc.model in ret) {
      ret[svc.model].push(svc)
    } else {
      ret[svc.model] = [svc]
    }
  }
  return ret
})
const expClsVsb = ref<boolean>(false)
const expClsObj = reactive<ExpCls>(new ExpCls())
const mdlOpns = computed<OpnType[]>(() =>
  [{ label: '无', value: '' }].concat(
    store.getters['project/models'].map((mdl: Model) => ({
      label: mdl.label || mdl.name,
      value: mdl.name
    }))
  )
)
const ctnrLogs = reactive<{
  visible: boolean
  content: string
  emitter: TinyEmitter
}>({
  visible: false,
  content: '',
  emitter: new TinyEmitter()
})
const esURL = computed(() =>
  pjtStt.value.stat === 'loading'
    ? '/mqtt'
    : `/${getDftPjt()}/api/v1/project/${pid}/docker/logs/access`
)
const actMdlTab = ref('struct')

watch(
  () => ctnrLogs.visible,
  (visible: boolean) => {
    if (visible) {
      setTimeout(() => {
        ctnrLogs.emitter.emit('start')
        if (pjtStt.value.stat === 'running' && navigator.userAgent.includes('Windows')) {
          setTimeout(() => setProp(ctnrLogs, 'visible', false), 10)
        }
      }, 10)
    } else {
      ctnrLogs.emitter.emit('stop')
    }
  }
)

async function refresh() {
  await store.dispatch('project/refresh')
  mdlEmitter.emit('refresh', project.value.models)
  svcEmitter.emit('refresh', project.value.services)
}
async function onConfigSbt(pjt: Project) {
  await api.update(pjt)
  await store.dispatch('project/refresh')
  pjtEmitter.emit('update:visible', false)
}
function onConfigClick() {
  pjtEmitter.emit('update:visible', {
    show: true,
    object: project.value
  })
}
function onRelMdlChange(prop: Property, mname: string) {
  if (!mname) {
    return prop.reset()
  }
  const model = store.getters['project/models'].find((mdl: Model) => mdl.name === mname)
  prop.name = model.name + 's'
  prop.label = model.label || ''
  prop.ptype = 'Id'
  prop.index = false
  prop.unique = false
  prop.visible = true
}
function onExpClsClick(model: Model) {
  expClsObj.update(model)
  expClsVsb.value = true
}
async function onExpClsSbt(formData: any) {
  await mdlAPI.export(formData)
  expClsVsb.value = false
}
function onMdlOprClick(selKey: 'design' | 'export', model: Model) {
  switch (selKey) {
    case 'design':
      router.push(`/project/${pid}/model/${model.key}/form`)
      break
    case 'export':
      onExpClsClick(model)
      break
  }
}
async function onTypoSubmit(typo: Typo, next: Function) {
  if (typo.key) {
    await typAPI.update(typo)
  } else {
    await typAPI.add(typo)
  }
  next()
  await store.dispatch('project/refresh')
}
function onSyncFinish() {
  store.commit('project/SET_STATUS', 'loading')
  ctnrLogs.emitter.emit('clean')
  ctnrLogs.visible = true
  console.log(store.getters['project/ins'])
}
</script>
