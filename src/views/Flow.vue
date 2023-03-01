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
        <TmpNdPanel />
        <NodeCard v-if="Object.values(nodes).length === 0" @click:addBtn="() => onEdtNodeClick()" />
        <template v-else>
          <NodeCard
            v-for="node in Object.values(nodes)"
            :key="node.key"
            :nd-key="node.key"
            @click:card="() => onEdtNodeClick(node)"
            @click:addBtn="(pvsKey: string) => onEdtNodeClick({ previous: pvsKey })"
          />
        </template>
      </div>
    </div>
    <FormDialog
      :title="editTitle"
      width="70vw"
      :lblWid="2"
      :copy="Node.copy"
      :object="editNode"
      v-model:show="edtNdVisible"
      :mapper="edtNdMapper"
      :emitter="edtNdEmitter"
      @submit="onNodeSaved"
      @initialize="store.dispatch('service/refreshTemps')"
    />
    <FormDialog
      title="选择组"
      width="35vw"
      v-model:show="joinVisible"
      :mapper="joinMapper"
      :copy="
        (src: any, tgt: any) => {
          tgt = tgt || { group: '' }
          tgt.group = src.group || tgt.group
          return tgt
        }
      "
      @submit="onGroupSelect"
      @initialize="onDialogInit"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import NodeCard from '../components/flow/NodeCard.vue'
import Node from '../types/node'
import { edtNdEmitter, edtNdMapper, edtNdVisible, joinMapper, joinVisible } from './Flow'
import { useStore } from 'vuex'
import VarsPanel from '../components/flow/VarsPanel.vue'
import TmpNdPanel from '../components/flow/TmpNdPanel.vue'
import { useRoute } from 'vue-router'
import { ndAPI as api } from '../apis'
import { NodesInPnl } from '@/store/service'
import { ArrowLeftOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'Flow',
  components: {
    NodeCard,
    VarsPanel,
    TmpNdPanel,

    ArrowLeftOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const sid = route.params.sid
    const panelRef = ref()
    const editNode = computed(() => store.getters['service/editNode'])
    const pname = computed(() => store.getters['project/ins'].name)
    const service = computed(() => store.getters['service/ins'])
    const editTitle = computed<string>(() => {
      const node = store.getters['service/editNode']
      if (!node) {
        return ''
      }
      if (node.key) {
        if (node.isTemp) {
          return `编辑模板节点#${node.key}`
        } else {
          return `编辑节点#${node.key}`
        }
      } else if (node.previous && node.previous.key) {
        return `在节点#${node.previous.key}后新增节点`
      } else {
        return '在根节点后新增节点'
      }
    })
    const nodes = computed(() => store.getters['service/nodes'] as NodesInPnl)
    const rszObs = new ResizeObserver(refresh)

    onBeforeMount(() => {
      store.commit('service/RESET_STATE')
    })
    onMounted(async () => {
      rszObs.observe(panelRef.value)
      await refresh()
    })

    async function refresh() {
      store.commit('service/SET_WIDTH', panelRef.value.clientWidth)
      await store.dispatch('service/refresh')
    }
    async function onNodeSaved(node: Node, next: () => void) {
      await api.save(node)
      next()
    }
    function onEdtNodeClick(node?: any) {
      edtNdEmitter.emit('update:show', true)
      store.commit('service/SET_NODE', { node })
    }
    async function onGroupSelect(edited: any) {
      await api.joinLib(edited.group)
      edtNdEmitter.emit('refresh')
    }
    async function onDialogInit() {
      await store.dispatch('service/refreshTemps')
      joinMapper['group'].options = store.getters['service/tempGrps']
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
      editNode,
      editTitle,
      joinVisible,
      joinMapper,
      edtNdVisible,
      edtNdEmitter,
      edtNdMapper,

      onNodeSaved,
      onGroupSelect,
      onEdtNodeClick,
      onDialogInit
    }
  }
})
</script>
