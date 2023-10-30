<template>
  <div class="flex justify-between mx-6 my-4">
    <a-space>
      <a-button @click="$router.go(-1)">
        <template #icon><arrow-left-outlined /></template>
      </a-button>
      <a-breadcrumb>
        <a-breadcrumb-item><a href="/">项目</a></a-breadcrumb-item>
        <a-breadcrumb-item>
          <a :href="`/project/${pid}`">
            {{ pname }}
          </a>
        </a-breadcrumb-item>
        <a-breadcrumb-item v-if="service.emit === 'api'">接口</a-breadcrumb-item>
        <a-breadcrumb-item v-else>任务</a-breadcrumb-item>
        <a-breadcrumb-item>
          <a :href="`/project/${pid}`">
            {{ service.name }}.{{ service.interface || service.method }}
          </a>
        </a-breadcrumb-item>
        <a-breadcrumb-item>设计流程</a-breadcrumb-item>
      </a-breadcrumb>
    </a-space>
    <a-button @click="onShowCodesClick">{{ codes ? '流程设计' : '显示代码' }}</a-button>
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
        <pre v-else>{{ codes }}</pre>
      </div>
    </div>
    <FormDialog
      :title="editTitle"
      width="70vw"
      :lblWid="2"
      :newFun="() => new Node()"
      :mapper="edtNdMapper"
      :emitter="edtNdEmitter"
      @submit="onNodeSaved"
    />
  </div>
</template>

<script lang="ts" setup name="Flow">
import svcAPI from '@/apis/service'
import { NodesInPnl } from '@/store/service'
import NodeInPnl from '@/types/ndInPnl'
import Service from '@/types/service'
import { until } from '@/utils'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { ndAPI as api, pjtAPI } from '../apis'
import NodeCard from '../components/flow/NodeCard.vue'
import VarsPanel from '../components/flow/VarsPanel.vue'
import Node from '../types/node'
import { edtNdEmitter, edtNdMapper } from './Flow'

const store = useStore()
const route = useRoute()
const pid = route.params.pid
const panelRef = ref()
const pname = ref('')
const service = computed<Service>(() => store.getters['service/ins'])
const editTitle = computed<string>(() =>
  store.getters['service/edtNdKey'] ? '编辑节点' : '添加节点'
)
const nodes = computed<NodeInPnl[]>(() =>
  Object.values(store.getters['service/nodes'] as NodesInPnl)
)
// const rszObs = new ResizeObserver(refresh)
const codes = ref('')
const loading = ref(false)

onBeforeMount(() => {
  store.commit('service/RESET_STATE')
})
onMounted(() => {
  // rszObs.observe(panelRef.value)
  refresh(true)
})
edtNdEmitter.on('delNode', (ndKey: string) => refresh([ndKey, 'delete']))

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
    codes.value = await svcAPI.flow.codes(route.params.sid)
  }
}
</script>
