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
        <template v-if="service.key">
          <a-breadcrumb-item v-if="service.emit === 'api'">接口</a-breadcrumb-item>
          <a-breadcrumb-item v-else>任务</a-breadcrumb-item>
          <a-breadcrumb-item>
            <a :href="`/server-package/project/${pid}`">
              {{ service.name }}.{{ service.interface || service.method }}
            </a>
          </a-breadcrumb-item>
        </template>
        <template v-else>
          <a-breadcrumb-item>自定义类</a-breadcrumb-item>
          <a-breadcrumb-item>
            <a :href="`/server-package/project/${pid}`">{{ tname }}.{{ fname }}</a>
          </a-breadcrumb-item>
        </template>
        <template v-if="store.getters['node/subNdKey']">
          <a-breadcrumb-item>
            <a @click="onBackClick">设计流程</a>
          </a-breadcrumb-item>
          <a-breadcrumb-item>
            {{ store.getters['node/subNdTtl'] }}
          </a-breadcrumb-item>
        </template>
        <a-breadcrumb-item v-else>设计流程</a-breadcrumb-item>
      </a-breadcrumb>
    </a-space>
    <PjtCtrlPnl @update:codes="onSetCodes" />
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
import PjtCtrlPnl from '@/components/flow/PjtCtrlPnl.vue'
import { NodesInPnl } from '@/store/node'
import NodeInPnl from '@/types/ndInPnl'
import Service from '@/types/service'
import Typo from '@/types/typo'
import { newOne, until } from '@/utils'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import { computed, onBeforeMount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import { ndAPI as api } from '../apis'
import NodeCard from '../components/flow/NodeCard.vue'
import VarsPanel from '../components/flow/VarsPanel.vue'
import Node, { NodeTypeMapper } from '../types/node'
import { nodeEmitter, nodeMapper } from './Flow'

const store = useStore()
const route = useRoute()
const router = useRouter()
const pid = route.params.pid as string
const panelRef = ref()
const pname = computed(() => store.getters['project/ins'].name)
const tname = computed(
  () => store.getters['project/ins'].typos.find((typo: Typo) => typo.key === route.params.tid)?.name
)
const fname = computed(() => store.getters['node/typFun'].name)
const service = computed<Service>(() => store.getters['node/service'])
const editTitle = computed<string>(() => {
  const node = store.getters['node/editNode'] as Node
  return `${node.key ? '编辑' : '添加'}${NodeTypeMapper[node.ntype]}`
})
const nodes = computed<NodeInPnl[]>(() => Object.values(store.getters['node/nodes'] as NodesInPnl))
// const rszObs = new ResizeObserver(refresh)
const codes = ref('')
const loading = ref(false)

onBeforeMount(() => {
  store.commit('node/RESET_STATE')
})
onMounted(() => {
  // rszObs.observe(panelRef.value)
  refresh(true)
})
nodeEmitter.on('delNode', (ndKey: string) => refresh([ndKey, 'delete']))

async function refresh(param: [string, 'save' | 'delete'] | boolean = false) {
  loading.value = true
  await until(() => panelRef.value)
  await store.dispatch('node/refresh', {
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
  store.commit('node/SET_NODE', node)
}
function onBackClick() {
  store.getters['node/subNdKey'] ? store.dispatch('node/setSubNid') : router.go(-1)
}
function onSetCodes(cds: string) {
  codes.value = cds
}
</script>
