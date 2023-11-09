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
            <a @click="refresh">{{ project.status.stat }}</a>
          </a-tag>
        </a-tooltip>
      </template>
      <template #extra>
        <a-button v-if="isFront" @click="() => frtEmitter.emit('update:show', true)">
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
        <a-button v-if="isFront" type="primary" @click="() => frtEmitter.emit('update:show', true)">
          <template #icon><ant-design-outlined /></template>
          前端设计
        </a-button>
        <a-button @click="onExportClick">
          <template #icon><export-outlined /></template>
          导出
        </a-button>
        <a-button @click="onConfigClick">
          <template #icon><SettingOutlined /></template>
          配置
        </a-button>
        <FormDialog
          title="配置项目"
          :new-fun="() => newOne(Project)"
          :emitter="pjtEmitter"
          :mapper="pjtMapper"
          @submit="onConfigSbt"
        />
        <a-tooltip v-if="project.thread">
          <template #title>传输本地文件到项目实例中</template>
          <a-button
            :disabled="project.status.stat === 'loading'"
            :loading="project.status.stat === 'loading'"
            @click="
              () => {
                tsfVsb = true
              }
            "
          >
            <template #icon><UploadOutlined /></template>
            传输文件
          </a-button>
        </a-tooltip>
        <FormDialog
          title="投放文件"
          :new-fun="() => newOne(Transfer)"
          v-model:show="tsfVsb"
          :mapper="tsMapper"
          :emitter="tsEmitter"
          @submit="onTransfer"
        />
        <a-tooltip>
          <template #title>在线编译可能导致服务器内存溢出，建议离线编译打包后在上传发布</template>
          <a-button type="primary" :loading="middle.loading" @click="onMidPubShow(true)">
            <template #icon><cloud-upload-outlined /></template>
            发布中台
          </a-button>
        </a-tooltip>
        <FormDialog
          title="配置中台"
          width="40vw"
          :new-fun="() => newOne(Middle)"
          :mapper="midDlg.mapper"
          :emitter="midDlg.emitter"
        >
          <template #footer="pubInfo">
            <a-space>
              <a-button @click="() => onMidGen(pubInfo)">导出</a-button>
              <a-upload
                name="file"
                :multiple="false"
                :directory="true"
                :showUploadList="false"
                action="/server-package/api/v1/temp/file"
                @change="(info: any) => onMidDep(info, pubInfo)"
              >
                <a-tooltip>
                  <template #title>选择build生成的dist文件夹</template>
                  <a-button>导入</a-button>
                </a-tooltip>
              </a-upload>
              <a-divider type="vertical" />
              <a-tooltip>
                <template #title>在线编译可能导致服务器内存溢出，建议导出后编译后再上传</template>
                <a-button type="primary" @click="onMidPub(pubInfo)">确定</a-button>
              </a-tooltip>
            </a-space>
          </template>
        </FormDialog>
        <a-button v-if="middle.url" :loading="middle.loading" :href="middle.url" target="_blank">
          <template #icon><eye-outlined /></template>
          浏览中台
        </a-button>
        <PjtCtrlBtns />
      </template>
      <a-descriptions size="small" :column="4">
        <a-descriptions-item label="占用端口">{{ project.port }}</a-descriptions-item>
        <template v-if="!isFront">
          <a-descriptions-item label="数据库">
            {{ project.database[0] }}/{{ project.database[1] }}
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
      <template v-if="project.status.stat === 'running'">
        <a-divider class="m-0">
          <a-button type="link" @click="onCtnrLogsVsb">
            <template #icon>
              <UpOutlined v-if="ctnrLogs.visible" />
              <DownOutlined v-else />
            </template>
            容器日志
          </a-button>
        </a-divider>
        <pre v-if="ctnrLogs.visible" class="bg-gray-100 p-2 h-64" ref="logPnl">{{
          ctnrLogs.content
        }}</pre>
      </template>
    </a-page-header>
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
      <template #opera="{ record: model }">
        <a-space>
          <a-button size="small" @click.stop="() => onExpClsClick(model)">
            <template #icon><ExportOutlined /></template>
            导出类
          </a-button>
          <a-button
            type="primary"
            size="small"
            @click.stop="() => router.push(`/project/${pid}/model/${model.key}/form`)"
          >
            <template #icon><FormOutlined /></template>
            表单/表项设计
          </a-button>
        </a-space>
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
                  reqPost('model/' + model.key+ '/property', data, { type: 'api' }).then(refresh),
                remove: (prop: any) =>
                  reqDelete('model/' + model.key, 'property/' + prop.key, { type: 'api' }).then(refresh),
                update: (data: any) =>
                  reqPut('model/' + model.key, 'property/' + data.key, data, { type: 'api' }).then(refresh)
              }"
              :columns="propColumns"
              :mapper="propMapper"
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
                          @change="(val: string) => { editing.relative.belong = val === 'belong' }"
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
                          @change="(checked: boolean) => { editing.ptype = checked ? 'Array' : 'Id' }"
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
              class="h-72"
              sclHeight="h-full"
              :columns="
                model.props.map((prop: any) =>
                  Column.copy({ title: prop.label, key: prop.name, dataIndex: prop.name })
                )
              "
              :mapper="createByFields(model.form.fields)"
              :new-fun="
                () =>
                  Object.fromEntries(model.props.map((prop: any) => [prop.name, bsTpDefault(prop.ptype)]))
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
    <SvcTable class="mt-10" :mapper="svcMapper" :columns="svcColumns" :emitter="svcEmitter" />
  </LytProject>
</template>

<script lang="ts" setup name="Project">
/* eslint-disable @typescript-eslint/no-explicit-any */
import MsvcSelect from '@/components/MsvcSelect.vue'
import PjtCtrlBtns from '@/components/PjtCtrlBtns.vue'
import SvcTable from '@/components/SvcTable.vue'
import { OpnType, bsTpDefault } from '@/types'
import ExpCls from '@/types/expCls'
import Frontend from '@/types/frontend'
import Middle from '@/types/middle'
import Model from '@/types/model'
import Project from '@/types/project'
import Property from '@/types/property'
import Service, { Method, mthdClrs } from '@/types/service'
import Transfer from '@/types/transfer'
import { getDftPjt, newOne, reqDelete, reqPost, reqPut, setProp } from '@/utils'
import {
  AntDesignOutlined,
  CloudUploadOutlined,
  DownOutlined,
  ExportOutlined,
  EyeOutlined,
  FormOutlined,
  Html5Outlined,
  PartitionOutlined,
  SettingOutlined,
  UpOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import Column from '@lib/types/column'
import Mapper, { createByFields } from '@lib/types/mapper'
import { Modal } from 'ant-design-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import { pjtAPI as api, mdlAPI, pjtAPI } from '../apis'
import LytProject from '../layouts/LytProject.vue'
import { mapper as pjtMapper } from './Home'
import { emitter as pjtEmitter } from './Home'
import {
  expMapper,
  columns as mdlColumns,
  mapper as mdlMapper,
  propColumns,
  propMapper
} from './Model'
import {
  frtEmitter,
  frtMapper,
  svcColumns,
  svcEmitter,
  svcMapper,
  tsEmitter,
  tsMapper
} from './Project'

const route = useRoute()
const router = useRouter()
const store = useStore()
const pid = route.params.pid as string
const project = computed<Project>(() => store.getters['project/ins'])
const isFront = computed<boolean>(() => store.getters['project/ins'].database.length === 0)
const tsfVsb = ref(false)
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
}>({
  visible: false,
  content: ''
})
const logPnl = ref<HTMLElement>()
const esURL = `/${getDftPjt()}/api/v1/project/${pid}/docker/logs/access`
const midDlg = reactive({
  emitter: new Emitter(),
  mapper: new Mapper({
    title: {
      label: '标题',
      placeholder: '登录页和首页的标题',
      type: 'Input'
    },
    prefix: {
      label: '路由前缀',
      placeholder: '/项目名/中台前缀/(home|login)',
      type: 'Input'
    },
    lclDep: {
      label: '本地部署',
      placeholder: '是否部署到项目实例，【非本地部署】相当于前后端分离',
      type: 'Checkbox'
    }
  })
})
const middle = computed(() => store.getters['project/middle'])
const actMdlTab = ref('struct')

async function refresh() {
  await store.dispatch('project/refresh')
  mdlEmitter.emit('refresh', project.value.models)
  svcEmitter.emit('refresh', project.value.services)
}
async function onConfigSbt(pjt: Project) {
  await api.update(pjt)
  await store.dispatch('project/refresh')
  pjtEmitter.emit('update:show', false)
}
function onConfigClick() {
  pjtEmitter.emit('update:show', {
    show: true,
    object: project.value
  })
}
async function onTransfer(info: Transfer) {
  await api.transfer(info)
  await store.dispatch('project/refresh')
  tsfVsb.value = false
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
function onExportClick() {
  Modal.confirm({
    title: '确定生成并导出Docker镜像吗？',
    onOk: () => pjtAPI.expDkrImg(pid, `${project.value.name}.tar`)
  })
}
async function onCtnrLogsVsb() {
  ctnrLogs.visible = !ctnrLogs.visible
  if (ctnrLogs.visible) {
    ctnrLogs.content = ''
    const es = new EventSource(esURL)
    es.addEventListener('message', e => {
      ctnrLogs.content += e.data
      const logOpt = logPnl.value
      if (logOpt) {
        if (logOpt.scrollHeight > logOpt.clientHeight) {
          setTimeout(() => {
            logOpt.scrollTop = logOpt.scrollHeight
          }, 0)
        }
      }
    })
    es.addEventListener('error', e => {
      console.error(e)
      es.close()
    })
  } else {
    await pjtAPI.logs.exit(pid)
  }
}
function onMidPubShow(show: boolean) {
  if (show) {
    midDlg.emitter.emit('update:data', store.getters['project/middle'])
  }
  midDlg.emitter.emit('update:show', show)
}
async function onMidPub(info: Middle) {
  await api.middle.publish(pid, info)
  store.dispatch('project/chkMidStatus')
  midDlg.emitter.emit('update:show', false)
}
async function onMidGen(_info: Middle) {
  await api.middle.generate(pid)
  midDlg.emitter.emit('update:show', false)
}
async function onMidDep(info: any, _pubInfo: Middle) {
  if (
    info.file.status === 'done' &&
    info.fileList
      .map((file: any) => file.status)
      .reduce((prev: any, curr: any) => prev && curr === 'done')
  ) {
    await api.middle.deploy(pid, {
      fileList: info.fileList.map((file: any) => ({
        name: file.name,
        src: file.response.result,
        dest: file.originFileObj.webkitRelativePath || file.name
      }))
    })
    midDlg.emitter.emit('update:show', false)
  }
}
function onExpClsClick(model: Model) {
  expClsObj.update(model)
  expClsVsb.value = true
}
async function onExpClsSbt(formData: any) {
  await mdlAPI.export(formData)
  expClsVsb.value = false
}
</script>
