<template>
  <div class="flex justify-between mx-6 my-4">
    <a-space>
      <a-button @click="onBackClick">
        <template #icon><arrow-left-outlined /></template>
      </a-button>
      <a-breadcrumb>
        <a-breadcrumb-item><a href="/">项目</a></a-breadcrumb-item>
        <a-breadcrumb-item>
          <a :href="`/server-package/project/${pid}`">
            {{ pname }}
          </a>
        </a-breadcrumb-item>
        <a-breadcrumb-item v-if="service.emit === 'api'">接口</a-breadcrumb-item>
        <a-breadcrumb-item v-else>任务</a-breadcrumb-item>
        <a-breadcrumb-item>
          <a :href="`/server-package/project/${pid}`">
            {{ service.name }}.{{ service.interface || service.method }}
          </a>
        </a-breadcrumb-item>
        <template v-if="store.getters['service/subNdKey']">
          <a-breadcrumb-item>
            <a @click="onBackClick">设计流程</a>
          </a-breadcrumb-item>
          <a-breadcrumb-item>
            {{ store.getters['service/subNdTtl'] }}
          </a-breadcrumb-item>
        </template>
        <a-breadcrumb-item v-else>设计流程</a-breadcrumb-item>
      </a-breadcrumb>
    </a-space>
    <div>
      <template v-if="pLoading">
        <LoadingOutlined />
        &nbsp;
        <a-typography-text type="secondary" class="mr-2">操作加载中……</a-typography-text>
      </template>
      <a-popover
        v-model:visible="flwOpnVsb"
        overlayClassName="popmu-p-0"
        trigger="click"
        placement="bottomRight"
      >
        <template #content>
          <a-menu class="w-48 border-r-0" mode="inline" @click="onFlowOpnClick">
            <a-menu-item key="show_codes">{{ codes ? '流程设计' : '显示代码' }}</a-menu-item>
            <a-menu-item-group title="项目控制">
              <a-menu-item key="project_sync" :disabled="pLoading">
                <template v-if="pLoading" #icon>
                  <LoadingOutlined />
                </template>
                同步
              </a-menu-item>
              <a-menu-item key="project_stop" v-if="project.thread || pLoading">停止</a-menu-item>
            </a-menu-item-group>
            <a-menu-item-group
              v-if="(service.emit === 'interval' || service.emit === 'timeout') && pRunning"
              title="服务控制"
            >
              <a-menu-item key="job_start">启动</a-menu-item>
              <a-menu-item v-if="service.jobId" key="job_stop">停止</a-menu-item>
            </a-menu-item-group>
          </a-menu>
        </template>
        <a-button>
          <template #icon><MoreOutlined /></template>
        </a-button>
      </a-popover>
    </div>
  </div>
  <div class="mx-6 mb-4 p-6 bg-white h-full overflow-y-auto">
    <div class="relative w-full h-full">
      <div class="absolute top-0 left-0 bottom-16 right-0 overflow-y-auto" ref="panelRef">
        <a-spin v-if="loading" class="w-full h-full" />
        <template v-else-if="!codes">
          <VarsPanel />
          <NodeCard v-if="nodes.length === 0" @click:addBtn="() => onEdtNodeClick()" />
          <template v-else>
            <NodeCard
              v-for="node in nodes"
              :key="node.key"
              :node="node"
              @click:card="() => onEdtNodeClick(node)"
              @click:addBtn="(previous: string) => onEdtNodeClick({ previous })"
            />
          </template>
        </template>
        <CodeEditor v-else class="h-full" :value="codes" :disabled="true" />
      </div>
    </div>
    <FormDialog
      :title="editTitle"
      width="70vw"
      :lblWid="2"
      :new-fun="() => newOne(Node)"
      :mapper="nodeMapper"
      :emitter="nodeEmitter"
      @submit="onNodeSaved"
    />
  </div>
</template>

<script lang="ts" setup name="Flow">
import svcAPI from '@/apis/service'
import { NodesInPnl } from '@/store/service'
import NodeInPnl from '@/types/ndInPnl'
import Project from '@/types/project'
import Service from '@/types/service'
import { newOne, until } from '@/utils'
import {
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  MoreOutlined
} from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { computed, createVNode, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import { ndAPI as api, ndAPI, pjtAPI } from '../apis'
import NodeCard from '../components/flow/NodeCard.vue'
import VarsPanel from '../components/flow/VarsPanel.vue'
import Node, { NodeTypeMapper } from '../types/node'
import { nodeEmitter, nodeMapper } from './Flow'

const store = useStore()
const route = useRoute()
const router = useRouter()
const pid = route.params.pid as string
const sid = route.params.sid as string
const panelRef = ref()
const pname = ref('')
const project = computed<Project>(() => store.getters['project/ins'])
const pLoading = computed<boolean>(() => store.getters['project/ins'].status.stat === 'loading')
const pRunning = computed<boolean>(() => store.getters['project/ins'].status.stat === 'running')
const service = computed<Service>(() => store.getters['service/ins'])
const editTitle = computed<string>(() => {
  const node = store.getters['service/editNode'] as Node
  return `${node.key ? '编辑' : '添加'}${NodeTypeMapper[node.ntype]}`
})
const nodes = computed<NodeInPnl[]>(() =>
  Object.values(store.getters['service/nodes'] as NodesInPnl)
)
// const rszObs = new ResizeObserver(refresh)
const codes = ref('')
const loading = ref(false)
const flwOpnVsb = ref(false)

onBeforeMount(() => {
  store.commit('service/RESET_STATE')
})
onMounted(() => {
  // rszObs.observe(panelRef.value)
  refresh(true)
})
nodeEmitter.on('delNode', (ndKey: string) => refresh([ndKey, 'delete']))

async function refresh(param: [string, 'save' | 'delete'] | boolean = false) {
  loading.value = true
  if (typeof param === 'boolean' && param) {
    pname.value = (await pjtAPI.detail(route.params.pid)).name
  }
  await until(() => panelRef.value)
  await store.dispatch('service/refresh', {
    force: typeof param === 'boolean' ? param : undefined,
    updNodes: Array.isArray(param) ? [param] : undefined,
    width: panelRef.value.clientWidth
  })
  loading.value = false
}
async function onNodeSaved(node: Node, next: () => void) {
  const ret = await api.save(node)
  next()
  await refresh([ret.key, 'save'])
}
function onEdtNodeClick(node?: any) {
  store.commit('service/SET_NODE', node)
}
async function onShowCodesClick() {
  if (codes.value) {
    codes.value = ''
  } else {
    codes.value = store.getters['service/subNdKey']
      ? await ndAPI.subNode.codes(store.getters['service/subNdKey'])
      : await svcAPI.flow.codes(sid)
  }
}
async function onFlowOpnClick({
  key
}: {
  key: 'show_codes' | 'project_sync' | 'project_stop' | 'job_start' | 'job_stop'
}) {
  flwOpnVsb.value = false
  switch (key) {
    case 'show_codes':
      await onShowCodesClick()
      break
    case 'project_sync':
      Modal.confirm({
        title: '确定（重）启动项目？',
        icon: createVNode(ExclamationCircleOutlined),
        onOk: () =>
          pjtAPI.sync(pid).then(() => setTimeout(() => store.dispatch('project/refresh'), 10))
      })
      break
    case 'project_stop':
      pjtAPI.stop(pid)
      break
    case 'job_start':
      await svcAPI.job.restart(sid)
      break
    case 'job_stop':
      await svcAPI.job.stop(sid)
      break
  }
}
function onBackClick() {
  store.getters['service/subNdKey'] ? store.dispatch('service/setSubNid') : router.go(-1)
}
</script>
