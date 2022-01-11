<template>
<a-card
  v-if="!first"
  size="small"
  ref="nodeRef"
  :bordered="false"
  :title="node.title"
  :style="{
    position: 'absolute',
    width: `${CardWidth}px`,
    left: `${node.posLT[0]}px`,
    top: `${node.posLT[1]}px`,
  }"
  :headStyle="{
    color: 'white',
    'background-color': 'orange',
  }"
  :bodyStyle="{
    border: '1px solid #f0f0f0'
  }"
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
  width: `${CardWidth}px`,
  left: `${arwSvgPosLT[0]}px`,
  top: `${arwSvgPosLT[1]}px`,
}">
  <line
    stroke-width="2"
    stroke="#f0f0f0"
    :x1="CardHlfWid" y1="0"
    :x2="CardHlfWid" :y2="ArrowHeight"
  />
</svg>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { AddBtnWH, AddBtnHlfWH, ArrowHeight, ArrowHlfHgt, CardWidth, CardHlfWid } from '@/views/Flow'
export default defineComponent({
  name: 'NodeCard',
  emits: [
    'update:size',
    'click:card',
    'click:addBtn'
  ],
  components: {
    PlusOutlined
  },
  props: {
    node: { type: Object, default: null },
    first: { type: Boolean, default: false },
    pnlWid: { type: Number, default: 0 },
  },
  setup (props, { emit }) {
    const nodeRef = ref()
    const addBtnPosLT = computed(() => props.node ? [
      props.node.posLT[0] + CardHlfWid - AddBtnHlfWH,
      props.node.posLT[1] + props.node.sizeWH[1] + ArrowHlfHgt - AddBtnHlfWH
    ] : [
      (props.pnlWid >> 1) - AddBtnHlfWH, 0
    ])
    const arwSvgPosLT = computed(() => props.node ? [
      props.node.posLT[0],
      props.node.posLT[1] + props.node.sizeWH[1]
    ] : [0, 0])

    onMounted(() => {
      emit('update:size', nodeRef.value ? [
        nodeRef.value.$el.clientWidth,
        nodeRef.value.$el.clientHeight
      ] : [CardWidth, 0])
    })
    return {
      CardWidth,
      CardHlfWid,
      ArrowHeight,
      nodeRef,
      addBtnPosLT,
      arwSvgPosLT
    }
  }
})
</script>
