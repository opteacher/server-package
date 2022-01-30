<template>
<FlowDesign>
  <div class="flow-panel" ref="panelRef">
    <DepsPanel/>
    <VarsPanel/>
    <TmpNdPanel/>
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
        @click:card="() => $store.commit('route/SET_NODE', { node })"
        @click:addBtn="onAddBtnClicked"
        @mouseenter="$store.commit('route/UPDATE_LOCVARS', node)"
        @mouseleave="$store.commit('route/UPDATE_LOCVARS')"
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
    @initialize="$store.dispatch('route/rfshTemps')"
  />
  <FormDialog
    title="选择组"
    width="35vw"
    :show="$store.getters['route/joinVsb']"
    :mapper="JoinMapper"
    :copy="(src, tgt) => {
      tgt = tgt || { group: '' }
      tgt.group = src.group || tgt.group
      return tgt
    }"
    @submit="async (edited) => {
      await $store.dispatch('route/joinLibrary', edited.group)
      EditNodeEmitter.emit('refresh')
    }"
    @update:show="() => $store.commit('route/SET_JOIN_VSB', false)"
    @initialize="async () => {
      await $store.dispatch('route/rfshTemps')
      JoinMapper['group'].options = $store.getters['route/tempGrps']
    }"
  />
</FlowDesign>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import FlowDesign from '../layouts/FlowDesign.vue'
import NodeCard from '../components/NodeCard.vue'
import { Node, Mapper } from '../common'
import FormDialog from '../components/com/FormDialog.vue'
import { EditNodeEmitter, EditNodeMapper, JoinMapper, onNodeSaved } from './Flow'
import { useStore } from 'vuex'
import DepsPanel from '../components/DepsPanel.vue'
import VarsPanel from '../components/VarsPanel.vue'
import TmpNdPanel from '../components/TmpNdPanel.vue'

export default defineComponent({
  name: 'Flow',
  components: {
    FlowDesign,
    NodeCard,
    FormDialog,
    DepsPanel,
    VarsPanel,
    TmpNdPanel,
  },
  setup () {
    const store = useStore()
    const panelRef = ref()
    const node = computed(() => store.getters['route/editNode'])
    const editTitle = computed(() => {
      if (node.value.key) {
        if (node.value.isTemp) {
          return `编辑模板节点#${node.value.key}`
        } else {
          return `编辑节点#${node.value.key}`
        }
      } else if (node.value.previous?.key) {
        return `在节点#${node.value.previous.key}后新增节点`
      } else {
        return '在根节点后新增节点'
      }
    })
    const nodes = computed(() => store.getters['route/nodes'])
    const rszObs = new ResizeObserver(async () => {
      store.commit('route/SET_WIDTH', panelRef.value?.clientWidth)
      await store.dispatch('route/refresh')
    })

    onMounted(() => {
      rszObs.observe(panelRef.value)
    })

    function onAddBtnClicked (previous: Node) {
      node.value.reset()
      store.commit('route/SET_NODE', {
        node: previous ? { previous } : undefined
      })
    }
    return {
      Node,

      nodes,
      panelRef,
      editTitle,
      JoinMapper,
      EditNodeEmitter,
      EditNodeMapper,

      reactive,
      onNodeSaved,
      onAddBtnClicked,
    }
  }
})
</script>

<style lang="less">
.flow-panel {
  position: absolute;
  top: 150px;
  left: 100px;
  bottom: 50px;
  right: 100px;
  overflow-y: auto;
}
</style>
