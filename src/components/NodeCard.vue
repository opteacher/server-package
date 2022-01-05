<template>
<a-card
  size="small"
  ref="nodeRef"
  :bordered="false"
  title="Small size card"
  class="step-card"
  :style="{
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
  @click="onCardClicked"
>
  <template #extra><a href="#">more</a></template>
  <a-row type="flex">
    <a-col flex="50px">
      <a-list size="small" :data-source="Object.values(node.inputs)">
        <template #renderItem="{ item: input }">
          <a-list-item>{{ input[1].name }}</a-list-item>
        </template>
      </a-list>
    </a-col>
    <a-col flex="auto">
      <a-card style="margin: 0 12px; height: 100%">
        <p>Code</p>
      </a-card>
    </a-col>
    <a-col flex="50px">
      <a-list size="small" :data-source="node.outputs">
        <template #renderItem="{ item: output }">
          <a-list-item>{{ output.name }}</a-list-item>
        </template>
      </a-list>
    </a-col>
  </a-row>
</a-card>
<a-button class="add-button" type="primary" shape="circle" :style="{
  left: `${addBtnPosLT[0]}px`, top: `${addBtnPosLT[1]}px`
}">
  <template #icon><PlusOutlined/></template>
</a-button>
<svg class="step-link" :style="{
  left: `${arwSvgPosLT[0]}px`, top: `${arwSvgPosLT[1]}px`,
}">
  <line
    stroke-width="2"
    stroke="#f0f0f0"
    x1="250" y1="0"
    x2="250" y2="100"
  />
</svg>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { Node } from '../common'
import { PlusOutlined } from '@ant-design/icons-vue'
export default defineComponent({
  name: 'NodeCard',
  emits: [
    'update:size',
    'click',
  ],
  components: {
    PlusOutlined
  },
  props: {
    node: { type: Node, required: true }
  },
  setup (props, { emit }) {
    const nodeRef = ref()
    const addBtnPosLT = computed(() => [
      props.node.posLT[0] + (props.node.sizeWH[0] >> 1) - 16,
      props.node.posLT[1] + props.node.sizeWH[1] + 50 - 16
    ])
    const arwSvgPosLT = computed(() => [
      props.node.posLT[0],
      props.node.posLT[1] + props.node.sizeWH[1]
    ])

    onMounted(() => {
      emit('update:size', [
        nodeRef.value.$el.clientWidth,
        nodeRef.value.$el.clientHeight
      ])
    })

    function onCardClicked () {
      emit('click')
    }
    return {
      nodeRef,
      addBtnPosLT,
      arwSvgPosLT,

      onCardClicked
    }
  }
})
</script>

<style lang="less" scoped>
.step-card {
  position: absolute;
  width: 500px;
}
.add-button {
  position: absolute;
}
.step-link {
  position: absolute;
  width: 500px;
  height: 100px;
  z-index: -100;
}
</style>
