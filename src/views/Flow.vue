<template>
<FlowDesign>
  <div class="flow-panel" ref="panelRef">
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
        @click:card="() => nodeForm.setEditNode(node)"
        @click:addBtn="onAddBtnClicked"
      />
    </template>
  </div>
  <FormDialog
    :title="editTitle"
    width="70vw"
    :column="[2, 22]"
    :copy="Node.copy"
    :show="nodeForm.show"
    :mapper="nodeForm.mapper"
    :object="nodeForm.editNode"
    @update:show="(show) => { nodeForm.show = show }"
    @submit="onNodeSaved"
  />
</FlowDesign>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import FlowDesign from '../layouts/FlowDesign.vue'
import NodeCard from '../components/NodeCard.vue'
import { Node } from '../common'
import FormDialog from '../components/com/FormDialog.vue'
import { NodeForm } from './Flow'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Flow',
  components: {
    FlowDesign,
    NodeCard,
    FormDialog
  },
  setup () {
    const route = useRoute()
    const store = useStore()
    const panelRef = ref()
    const nodeForm = reactive(new NodeForm())
    const nodes = computed(() => store.getters['route/nodes'])
    const editTitle = computed(() => {
      if (nodeForm.editNode.key) {
        return `编辑节点#${nodeForm.editNode.key}`
      } else if (nodeForm.editNode.previous?.key) {
        return `在节点#${nodeForm.editNode.previous.key}后新增节点`
      } else {
        return '在根节点后新增节点'
      }
    })
    const rszObs = new ResizeObserver(async () => {
      store.commit('route/SET_WIDTH', panelRef.value?.clientWidth)
      await store.dispatch('route/refresh', route.params.rid as string)
    })

    onMounted(() => {
      rszObs.observe(panelRef.value)
    })

    function onAddBtnClicked (previous: Node) {
      nodeForm.editNode.reset()
      if (previous) {
        Node.copy({ previous }, nodeForm.editNode)
      }
      nodeForm.show = true
    }
    async function onNodeSaved (node: Node, next: () => void) {
      await store.dispatch('route/saveNode', Node.copy(node))
      next()
    }
    return {
      Node,

      nodes,
      nodeForm,
      panelRef,
      editTitle,

      onNodeSaved,
      onAddBtnClicked
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
