<template>
<FlowDesign>
  <div class="flow-panel" ref="panelRef">
    <div v-show="locVars.length" :style="{
      position: 'fixed',
      width: '15vw',
      top: '150px',
      right: '100px',
      'z-index': 1000,
      'background-color': 'white'
    }">
      <a-list size="small" bordered :data-source="locVars">
        <template #header>
          <h4 class="mb-0">可用变量：</h4>
        </template>
        <template #renderItem="{ item: locVar }">
          <a-list-item>-&nbsp;{{ locVar.name }}:&nbsp;{{ locVar.type }}</a-list-item>
        </template>
      </a-list>
    </div>
    <NodeCard
      v-if="Object.values(nodes).length === 0"
      :first="true"
      @click:addBtn="onAddBtnClicked"
    />
    <template v-else>
      <NodeCard
        v-for="node in Object.values(nodes)"
        :key="node.key"
        :node="node"
        @click:card="() => $store.commit('route/SET_NODE', node)"
        @click:addBtn="onAddBtnClicked"
        @mouseenter="onNodeHover(node)"
        @mouseleave="onNodeHover(null)"
      />
    </template>
  </div>
  <FormDialog
    :title="editTitle"
    width="70vw"
    :column="[2, 22]"
    :copy="Node.copy"
    :show="$store.getters['route/nodeVsb']"
    :mapper="EditNodeMapper"
    :object="$store.getters['route/editNode']"
    :emitter="EditNodeEmitter"
    @update:show="() => $store.commit('route/SET_NODE_INVSB')"
    @submit="onNodeSaved"
    @initialize="onEdtDlgInit"
  />
  <JoinDialog @submit="onJoinSubmit"/>
</FlowDesign>
</template>

<script lang="ts">
import { computed, defineComponent, nextTick, onMounted, reactive, ref } from 'vue'
import FlowDesign from '../layouts/FlowDesign.vue'
import NodeCard from '../components/NodeCard.vue'
import { Node, Variable } from '../common'
import FormDialog from '../components/com/FormDialog.vue'
import { EditNodeEmitter, EditNodeMapper } from './Flow'
import { useStore } from 'vuex'
import JoinDialog from '../components/JoinDialog.vue'

export default defineComponent({
  name: 'Flow',
  components: {
    FlowDesign,
    NodeCard,
    FormDialog,
    JoinDialog
  },
  setup () {
    const store = useStore()
    const panelRef = ref()
    const node = computed(() => store.getters['route/editNode'])
    const nodes = computed(() => store.getters['route/nodes'])
    const editTitle = computed(() => {
      if (node.value.key) {
        return `编辑节点#${node.value.key}`
      } else if (node.value.previous?.key) {
        return `在节点#${node.value.previous.key}后新增节点`
      } else {
        return '在根节点后新增节点'
      }
    })
    const rszObs = new ResizeObserver(async () => {
      store.commit('route/SET_WIDTH', panelRef.value?.clientWidth)
      await store.dispatch('route/refresh')
    })
    const locVars = reactive([] as Variable[])

    onMounted(() => {
      rszObs.observe(panelRef.value)
    })

    function onAddBtnClicked (previous: Node) {
      node.value.reset()
      store.commit('route/SET_NODE', previous ? { previous } : undefined)
    }
    async function onNodeSaved (node: Node, next: () => void) {
      await store.dispatch('route/saveNode', Node.copy(node))
      next()
    }
    function onNodeHover (node: Node | null) {
      locVars.splice(0, locVars.length)
      if (node) {
        nextTick(() => {
          locVars.push(...store.getters['route/locVars'](node))
        })
      }
    }
    async function onJoinSubmit (group: string) {
      await store.dispatch('route/joinLibrary', group)
    }
    async function onEdtDlgInit () {
      await store.dispatch('route/rfshTemps')
    }
    return {
      Node,

      nodes,
      EditNodeMapper,
      EditNodeEmitter,
      panelRef,
      editTitle,
      locVars,

      onNodeSaved,
      onAddBtnClicked,
      onNodeHover,
      onJoinSubmit,
      onEdtDlgInit
    }
  }
})
</script>

<style lang="less">
// 1px solid #f0f0f0
.flow-panel {
  position: absolute;
  top: 150px;
  left: 100px;
  bottom: 50px;
  right: 100px;
  overflow-y: auto;
}
</style>
