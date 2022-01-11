<template>
<FlowDesign :route="current">
  <div class="flow-panel" ref="panelRef">
    <NodeCard
      v-if="Object.values(nodes).length === 0"
      :first="true"
      :pnlWid="pnlWid"
      @click:addBtn="onAddBtnClicked"
    />
    <template v-else>
      <NodeCard
        v-for="node in Object.values(nodes)"
        :key="node.key"
        :node="node"
        @update:size="(szWH) => onNodeSzUpdated(node, szWH)"
        @click:card="() => onCardClicked(node)"
        @click:addBtn="onAddBtnClicked"
      />
    </template>
  </div>
  <FormDialog
    :title="editTitle"
    width="70vw"
    :column="[2, 22]"
    :show="editNode.show"
    :mapper="editNode.mapper"
    :object="editNode.current"
    :copy="Node.copy"
    @update:show="(show) => editNode.show = show"
    @submit="onNodeSaved"
  />
</FlowDesign>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import FlowDesign from '../layouts/FlowDesign.vue'
import NodeCard from '../components/NodeCard.vue'
import { Node, Route } from '../common'
import FormDialog from '../components/com/FormDialog.vue'
import { ArrowHeight, CardWidth, EditNodeFormDlg, NodeInPnl } from './Flow'
import { reqGet } from '@/utils'

export default defineComponent({
  name: 'Flow',
  components: {
    FlowDesign,
    NodeCard,
    FormDialog
  },
  setup () {
    const route = useRoute()
    const current = reactive(new Route())
    const nodes = reactive({} as {
      [key: string]: NodeInPnl
    })
    const panelRef = ref()
    const editNode = reactive(new EditNodeFormDlg())
    const pnlWid = computed(() => {
      return panelRef.value ? panelRef.value.clientWidth : 0
    })
    const editTitle = computed(() => {
      if (editNode.current.key) {
        return `编辑节点#${editNode.current.key}`
      } else if (editNode.current.previous?.key) {
        return `在节点#${editNode.current.previous.key}后新增节点`
      } else {
        return '在根节点后新增节点'
      }
    })

    onMounted(refresh)
    editNode.emitter.on('refresh', refresh)
    editNode.emitter.on('update:show', (show: boolean) => {
      editNode.show = show
    })
    editNode.emitter.on('remove:node', (key: string) => {
      delete nodes[key]
    })

    async function refresh () {
      Route.copy((await reqGet('route', route.params.rid)).data, current)
      if (current && current.flow) {
        await buildNodes(current.flow.key, 0)
      }
    }
    async function buildNodes (ndKey: string, height: number) {
      const data = (await reqGet('node', ndKey)).data
      let node: NodeInPnl
      if (!(ndKey in nodes)) {
        node = Object.assign(Node.copy(data), {
          posLT: [-1, -1], sizeWH: [0, 0]
        }) as NodeInPnl
        nodes[ndKey] = node
      } else {
        Node.copy(data, nodes[ndKey])
        node = nodes[ndKey]
      }
      if (!node.previous) {
        node.posLT[0] = pnlWid.value >> 1
      } else {
        const nexts = node.previous.nexts
        const index = nexts.indexOf(node.key) + 1
        const size = nexts.length + 1
        node.posLT[0] = (index / size) * pnlWid.value
      }
      node.posLT[0] -= (CardWidth >> 1)
      node.posLT[1] = height
      for (const nxtNode of node.nexts) {
        const nxtNdKey = typeof nxtNode === 'string' ? nxtNode : nxtNode.key
        await buildNodes(nxtNdKey, node.posLT[1] + node.sizeWH[1] + ArrowHeight)
      }
    }
    function onNodeSzUpdated (node: NodeInPnl, sizeWH: [number, number]) {
      node.sizeWH = sizeWH
      refresh()
    }
    function onCardClicked (node: Node) {
      editNode.current.reset()
      Node.copy(node, editNode.current)
      editNode.show = true
    }
    function onAddBtnClicked (previous: Node) {
      editNode.current.reset()
      if (previous) {
        Node.copy({ previous }, editNode.current)
      }
      editNode.show = true
    }
    function onNodeSaved (node: Node) {
      if (node.previous && node.previous.key) {
        editNode.saveNode(node.previous)
      } else {
        editNode.saveNode(route.params.rid as string)
      }
    }
    return {
      Node,
      nodes,
      current,
      editNode,
      panelRef,
      pnlWid,
      editTitle,

      onNodeSzUpdated,
      onCardClicked,
      onAddBtnClicked,
      onNodeSaved
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
