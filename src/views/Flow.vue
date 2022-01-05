<template>
<ProjDetail :editProj="project">
  <div class="flow-panel" ref="panelRef">
    <NodeCard
      v-for="node in nodes"
      :key="node.key"
      :node="node"
      @update:size="(szWH) => onNodeSzChanged(node, szWH)"
      @click="() => {
        editNode.show = true
        editNode.current = node
      }"
    />
  </div>
  <FormDialog
    title="修改节点"
    :mapper="editNode.mapper"
    :object="editNode.current"
    :show="editNode.show"
    @update:show="(show) => editNode.show = show"
  />
</ProjDetail>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ProjDetail from '../layouts/ProjDetail.vue'
import NodeCard from '../components/NodeCard.vue'
import { EditProjFormDlg } from './Home'
import { Node, Attr } from '../common'
import FormDialog from '../components/com/FormDialog.vue'
import { EditNodeFormDlg } from './Flow'
export default defineComponent({
  name: 'Flow',
  components: {
    ProjDetail,
    NodeCard,
    FormDialog
  },
  setup () {
    const route = useRoute()
    const project = reactive(new EditProjFormDlg())
    const rootNode = computed(() => project.current
      .models.find(mdl => mdl.key === route.params.mid)
      ?.routes.find(rt => rt.key === route.params.rid)
      ?.flow
    )
    const nodes = ref([] as Node[])
    const panelRef = ref()
    const editNode = reactive(new EditNodeFormDlg())

    onMounted(async () => {
      await project.refresh(route.params.pid as string)
      // @_@: 测试用数据
      const rt = project.current
        .models.find(mdl => mdl.key === route.params.mid)
        ?.routes.find(rt => rt.key === route.params.rid)
      if (!rt) {
        return
      }
      rt.flow = Node.copy({
        inputs: [
          ['', Attr.copy({ name: 'cccc', type: 'Number' })],
          ['', Attr.copy({ name: 'vvvv', type: 'String' })]
        ],
        outputs: [
          Attr.copy({ name: 'dddd', type: 'Number' })
        ]
      })
      rt.flow.nexts = [
        new Node()
      ]
      // @_@
      if (rootNode.value) {
        nodes.value = buildNodes(rootNode.value, 0)
      }
    })

    function buildNodes (node: Node, height: number): Node[] {
      if (!node.previous) {
        node.posLT[0] = panelRef.value.clientWidth >> 1
      } else {
        const nexts = node.previous.nexts
        node.posLT[0] = (nexts.indexOf(node) / nexts.length) * panelRef.value.clientWidth
      }
      node.posLT[0] -= 250
      node.posLT[1] = height
      const ret = [node]
      for (const subNode of node.nexts) {
        ret.push(...buildNodes(subNode, node.sizeWH[1] + 100))
      }
      return ret
    }
    function onNodeSzChanged (node: Node, sizeWH: [number, number]) {
      node.sizeWH = sizeWH
      if (rootNode.value) {
        nodes.value = buildNodes(rootNode.value, 0)
      }
    }
    return {
      nodes,
      project,
      editNode,
      panelRef,

      onNodeSzChanged
    }
  }
})
</script>

<style lang="less">
// 1px solid #f0f0f0
.flow-panel {
  position: absolute;
  top: 250px;
  left: 100px;
  bottom: 50px;
  right: 100px;
  overflow-y: auto;
}
</style>
