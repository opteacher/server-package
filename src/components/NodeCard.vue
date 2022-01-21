<template>
<svg v-if="node && node.previous" :style="{
  position: 'absolute',
  'z-index': -100,
  width: `${CardWidth}px`,
  height: `${ArrowHlfHgt}px`,
  left: `${node.posLT[0]}px`,
  top: `${node.posLT[1] - ArrowHlfHgt}px`,
}">
  <line
    stroke-width="2"
    stroke="#f0f0f0"
    :x1="CardHlfWid" :y1="0"
    :x2="CardHlfWid" :y2="ArrowHlfHgt"
  />
</svg>
<a-card
  v-if="!first"
  size="small"
  ref="nodeRef"
  :bordered="false"
  :title="title"
  :style="{
    position: 'absolute',
    width: `${CardWidth}px`,
    left: `${node.posLT[0]}px`,
    top: `${node.posLT[1]}px`,
  }"
  :headStyle="{
    color: 'white',
    'background-color': color
  }"
  :bodyStyle="{ border: '1px solid #f0f0f0' }"
  hoverable
  @click="$emit('click:card')"
>
  <a-row type="flex">
    <a-col flex="10px">
      <a-tag
        v-for="input in node.inputs"
        :key="input.key" color="#108ee9"
      >{{ input.name }}</a-tag>
    </a-col>
    <a-col flex="auto">
      <a-card style="margin: 0 12px; height: 100%">
        <p>Code</p>
      </a-card>
    </a-col>
    <a-col flex="10px">
      <a-tag
        v-for="output in node.outputs"
        :key="output.key" color="#87d068"
      >{{ output.name }}</a-tag>
    </a-col>
  </a-row>
</a-card>
<a-button type="primary" shape="circle" :style="{
  position: 'absolute',
  left: `${addBtnPosLT[0]}px`,
  top: `${addBtnPosLT[1]}px`
}" @click="$emit('click:addBtn', node)">
  <template #icon><PlusOutlined/></template>
</a-button>
<svg v-if="!first" :style="{
  position: 'absolute',
  'z-index': -100,
  width: `${arwSvgSizeW}px`,
  height: `${ArrowHlfHgt}px`,
  left: `${arwSvgPosLT[0]}px`,
  top: `${arwSvgPosLT[1]}px`,
}">
  <line
    stroke-width="2"
    stroke="#f0f0f0"
    :x1="arwSvgSizeW >> 1" :y1="0"
    :x2="arwSvgSizeW >> 1" :y2="ArrowHlfHgt"
  />
  <template v-if="nexts.length > 1">
    <line
      stroke-width="4"
      stroke="#f0f0f0"
      :x1="0" :y1="ArrowHlfHgt"
      :x2="arwSvgSizeW" :y2="ArrowHlfHgt"
    />
  </template>
</svg>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { AddBtnHlfWH, ArrowHeight, ArrowHlfHgt, CardWidth, CardHlfWid, Node, NodeTypeMapper, NodeType } from '@/common'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'NodeCard',
  emits: [
    'click:card',
    'click:addBtn'
  ],
  components: {
    PlusOutlined
  },
  props: {
    node: { type: Object, default: null },
    first: { type: Boolean, default: false },
  },
  setup (props) {
    const store = useStore()
    const nodeRef = ref()
    const title = computed(() => `# ${NodeTypeMapper[props.node.type as NodeType]} - ${props.node.title}`)
    const addBtnPosLT = computed(() => props.node ? [
      props.node.posLT[0] + CardHlfWid - AddBtnHlfWH,
      props.node.posLT[1] + props.node.size[1] + ArrowHlfHgt - AddBtnHlfWH
    ] : [
      (store.getters['route/width'] >> 1) - AddBtnHlfWH, 0
    ])
    const arwSvgPosLT = computed(() => props.node ? [
      props.node.posLT[0] - (arwSvgSizeW.value >> 1) + CardHlfWid,
      props.node.posLT[1] + props.node.size[1]
    ] : [0, 0])
    const color = computed(() => {
      switch (props.node.type) {
      case 'normal':
        return '#FF9900'
      case 'condition':
        return '#00AA72'
      case 'condNode':
        return '#FF5600'
      case 'traversal':
        return '#0D58A6'
      default:
        return 'grey'
      }
    })
    const nexts = computed(() => props.node.nexts.map((next: Node) => {
      return next && next.key ? store.getters['route/node'](next.key) : undefined
    }).filter((node: any) => node))
    const arwSvgSizeW = computed(() => {
      if (!props.node.nexts || !props.node.nexts.length) {
        return CardWidth
      }
      const lstIdx = props.node.nexts.length - 1
      const fstKey = props.node.nexts[0].key
      const lstKey = props.node.nexts[lstIdx].key
      const first = store.getters['route/nodes'][fstKey]
      const last = store.getters['route/nodes'][lstKey]
      if (!first || !first.posLT || !last ||!last.posLT
      || last.posLT[0] <= first.posLT[0]) {
        return CardWidth
      }
      return last.posLT[0] - first.posLT[0]
    })

    onMounted(async () => {
      if (!props.node) {
        return
      }
      store.commit('route/SET_ND_SIZE', {
        ndKey: props.node.key,
        size: nodeRef.value ? [
          nodeRef.value.$el.clientWidth,
          nodeRef.value.$el.clientHeight
        ] : [CardWidth, 0]
      })
      await store.dispatch('route/refresh')
    })
    return {
      CardWidth,
      CardHlfWid,
      ArrowHeight,
      ArrowHlfHgt,
      title,
      color,
      nexts,
      nodeRef,
      addBtnPosLT,
      arwSvgPosLT,
      arwSvgSizeW
    }
  }
})
</script>
