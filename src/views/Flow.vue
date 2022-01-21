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
        @click:card="() => $store.commit('route/SET_NODE', node)"
        @click:addBtn="onAddBtnClicked"
      />
    </template>
  </div>
  <FormDialog
    :title="editTitle"
    width="70vw"
    :column="[2, 22]"
    :copy="Node.copy"
    :show="$store.getters['route/visible']"
    :mapper="EditNodeMapper"
    :object="$store.getters['route/editNode']"
    @update:show="(show) => $store.commit('route/SET_INVISIBLE')"
    @submit="onNodeSaved"
  />
</FlowDesign>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import FlowDesign from '../layouts/FlowDesign.vue'
import NodeCard from '../components/NodeCard.vue'
import { Node } from '../common'
import FormDialog from '../components/com/FormDialog.vue'
import { EditNodeMapper } from './Flow'
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
      await store.dispatch('route/refresh', {
        rid: route.params.rid as string
      })
    })

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
    return {
      Node,

      nodes,
      EditNodeMapper,
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
