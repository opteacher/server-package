<template>
  <a-space class="mx-6 my-4">
    <a-button @click="$router.go(-1)">
      <template #icon><arrow-left-outlined /></template>
    </a-button>
    <a-breadcrumb>
      <a-breadcrumb-item><a href="/server-package/">项目</a></a-breadcrumb-item>
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
      <a-breadcrumb-item>设计流程</a-breadcrumb-item>
    </a-breadcrumb>
  </a-space>
  <div class="mx-6 mb-4 p-6 bg-white h-full overflow-y-auto">
    <div class="relative w-full h-full">
      <div class="absolute top-0 left-0 bottom-16 right-0 overflow-y-auto" ref="panelRef">
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
      </div>
    </div>
    <FormDialog
      :title="editTitle"
      width="70vw"
      :lblWid="2"
      :copy="Node.copy"
      :mapper="edtNdMapper"
      :emitter="edtNdEmitter"
      @submit="onNodeSaved"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import NodeCard from '../components/flow/NodeCard.vue'
import Node from '../types/node'
import { edtNdEmitter, edtNdMapper } from './Flow'
import { useStore } from 'vuex'
import VarsPanel from '../components/flow/VarsPanel.vue'
import { useRoute } from 'vue-router'
import { ndAPI as api, pjtAPI } from '../apis'
import { NodesInPnl } from '@/store/service'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
import NodeInPnl from '@/types/ndInPnl'
import Service from '@/types/service'

export default defineComponent({
  name: 'Flow',
  components: {
    NodeCard,
    VarsPanel,

    ArrowLeftOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const sid = route.params.sid
    const panelRef = ref()
    const pname = ref('')
    const service = computed<Service>(() => store.getters['service/ins'])
    const editTitle = computed<string>(() => {
      const node = store.getters['service/editNode']
      return node && node.key ? `编辑节点#${node.key}` : '添加节点'
    })
    const nodes = computed<NodeInPnl[]>(() =>
      Object.values(store.getters['service/nodes'] as NodesInPnl)
    )
    const rszObs = new ResizeObserver(refresh)

    onBeforeMount(() => {
      store.commit('service/RESET_STATE')
    })
    onMounted(async () => {
      rszObs.observe(panelRef.value)
      await refresh()
    })

    async function refresh() {
      pname.value = (await pjtAPI.detail(route.params.pid)).name
      store.commit('service/SET_WIDTH', panelRef.value.clientWidth)
      await store.dispatch('service/refresh')
    }
    async function onNodeSaved(node: Node, next: () => void) {
      await api.save(node)
      next()
    }
    function onEdtNodeClick(node?: any) {
      store.commit('service/SET_NODE', node)
    }
    return {
      Node,

      pid,
      sid,
      api,
      store,
      nodes,
      pname,
      service,
      panelRef,
      editTitle,
      edtNdEmitter,
      edtNdMapper,

      onNodeSaved,
      onEdtNodeClick
    }
  }
})
</script>
