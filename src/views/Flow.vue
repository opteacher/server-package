<template>
  <a-space style="margin: 16px 24px">
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
      <a-breadcrumb-item>
        <a :href="`/server-package/project/${pid}`">模型</a>
      </a-breadcrumb-item>
      <a-breadcrumb-item>
        <a :href="`/server-package/project/${pid}/model/${mid}`">{{ mname }}</a>
      </a-breadcrumb-item>
      <a-breadcrumb-item v-if="service.emit === 'api'">接口</a-breadcrumb-item>
      <a-breadcrumb-item v-else>任务</a-breadcrumb-item>
      <a-breadcrumb-item>
        <a :href="`/server-package/project/${pid}/model/${mid}`">
          {{ service.name }}_{{ service.interface || service.method }}
        </a>
      </a-breadcrumb-item>
      <a-breadcrumb-item>设计流程</a-breadcrumb-item>
    </a-breadcrumb>
  </a-space>
  <div
    :style="{
      margin: '0 24px 16px 24px',
      padding: '24px',
      background: '#fff',
      height: '100%',
      overflowY: 'auto'
    }"
  >
    <div style="position: relative; width: 100%; height: 100%">
      <div class="flow-panel" ref="panelRef">
        <VarsPanel />
        <TmpNdPanel />
        <NodeCard v-if="Object.values(nodes).length === 0" @click:addBtn="onAddBtnClicked" />
        <template v-else>
          <NodeCard
            v-for="node in Object.values(nodes)"
            :key="node.key"
            :nd-key="node.key"
            @click:card="() => store.commit('service/SET_NODE', { node })"
            @click:addBtn="onAddBtnClicked"
          />
        </template>
      </div>
    </div>
    <FormDialog
      :title="editTitle"
      width="70vw"
      :column="[2, 22]"
      :copy="Node.copy"
      :show="store.getters['service/nodeVsb']"
      :mapper="edtNdMapper"
      :object="store.getters['service/editNode']"
      :emitter="edtNdEmitter"
      @update:show="() => store.commit('service/SET_NODE_INVSB')"
      @submit="onNodeSaved"
      @initialize="store.dispatch('service/refreshTemps')"
    />
    <FormDialog
      title="选择组"
      width="35vw"
      :show="store.getters['service/joinVsb']"
      :mapper="joinMapper"
      :copy="
        (src: any, tgt: any) => {
          tgt = tgt || { group: '' }
          tgt.group = src.group || tgt.group
          return tgt
        }
      "
      @submit="onGroupSelect"
      @update:show="() => store.commit('service/SET_JOIN_VSB', false)"
      @initialize="onDialogInit"
    />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import NodeCard from '../components/flow/NodeCard.vue'
import Node from '../types/node'
import FormDialog from '../components/com/FormDialog.vue'
import { edtNdEmitter, edtNdMapper, joinMapper } from './Flow'
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
    FormDialog,
    VarsPanel,
    TmpNdPanel,

    ArrowLeftOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const mid = route.params.mid
    const sid = route.params.sid
    const panelRef = ref()
    const node = computed(() => store.getters['service/editNode'])
    const pname = computed(() => store.getters['project/ins'].name)
    const mname = computed(() => store.getters['model/ins'].name)
    const service = computed(() => store.getters['service/ins'])
    const editTitle = computed(() => {
      if (node.value.key) {
        if (node.value.isTemp) {
          return `编辑模板节点#${node.value.key}`
        } else {
          return `编辑节点#${node.value.key}`
        }
      } else if (node.value.previous && node.value.previous.key) {
        return `在节点#${node.value.previous.key}后新增节点`
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
    function onAddBtnClicked(pvsKey: string) {
      node.value.reset()
      store.commit('service/SET_NODE', {
        node: pvsKey ? { previous: pvsKey } : undefined
      })
    }
    async function onNodeSaved(node: Node, next: () => void) {
      await api.save(node)
      next()
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
      mid,
      sid,
      api,
      store,
      nodes,
      pname,
      mname,
      service,
      panelRef,
      editTitle,
      joinMapper,
      edtNdEmitter,
      edtNdMapper,

      onNodeSaved,
      onAddBtnClicked,
      onGroupSelect,
      onDialogInit
    }
  }
})
</script>

<style lang="less">
.flow-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 64px;
  right: 0;
  overflow-y: auto;
}
</style>
