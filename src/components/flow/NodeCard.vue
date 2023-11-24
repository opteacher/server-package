<template>
  <svg
    v-if="node && node.previous"
    class="absolute"
    :style="{
      width: `${arwTopSvgSizeW}px`,
      height: `${ArrowHlfHgt}px`,
      left: `${arwTopSvgPosLT[0]}px`,
      top: `${arwTopSvgPosLT[1]}px`
    }"
  >
    <line
      stroke-width="2"
      :stroke="StokeColor"
      :x1="arwTopSvgSizeW >> 1"
      :y1="0"
      :x2="arwTopSvgSizeW >> 1"
      :y2="ArrowHlfHgt"
    />
    <template v-if="multiCond">
      <line stroke-width="4" :stroke="StokeColor" :x1="0" :y1="0" :x2="arwTopSvgSizeW" :y2="0" />
    </template>
  </svg>
  <a-card
    v-if="node.key"
    :id="node.key"
    size="small"
    ref="nodeRef"
    :bordered="false"
    class="absolute"
    :style="{
      width: `${CardWidth}px`,
      left: `${node.posLT[0]}px`,
      top: `${node.posLT[1]}px`
    }"
    :headStyle="{
      color: 'white',
      'background-color': color
    }"
    :bodyStyle="{
      position: 'relative',
      minHeight: '60px',
      border: `1px solid ${StokeColor}`
    }"
    hoverable
    @click="$emit('click:card')"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
  >
    <template #title>
      <a-space>
        <h3 class="text-white mb-0">
          <FunctionOutlined v-if="node.ntype === 'normal' && node.isFun" />
          <BorderlessTableOutlined v-else />
          &nbsp;{{ node.title }}&nbsp;
        </h3>
        <template v-if="node.ntype === 'traversal'">
          <a-tag v-if="node.isAwait" color="green">await</a-tag>
          <a-tag v-else-if="node.isForIn" color="blue">for……in循环</a-tag>
        </template>
      </a-space>
    </template>
    <template #extra>
      <a-dropdown :trigger="['click']">
        <template #overlay>
          <a-menu mode="inline">
            <a-menu-item key="deps">依赖：{{ node.deps.length }}个模组</a-menu-item>
          </a-menu>
        </template>
        <a-button type="text" class="hover:border hover:border-white" @click.stop>
          <template #icon><more-outlined class="text-white" /></template>
        </a-button>
      </a-dropdown>
    </template>
    <a-row type="flex">
      <a-col v-if="node.inputs.length" flex="1px">
        <div class="relative">
          <div class="absolute z-50 right-0 text-right">
            <a-tag
              v-for="input in node.inputs"
              :key="input.key"
              class="border-0 mr-0"
              :class="{ 'filled-input': input.value }"
              color="#108ee9"
            >
              <template v-if="input.value && input.value !== input.name">
                {{ input.value }}&nbsp;
                <RightOutlined />
                &nbsp;{{ input.name }}
              </template>
              <template v-else>
                <LoginOutlined />
                &nbsp;{{ input.value || input.name }}
              </template>
            </a-tag>
          </div>
        </div>
      </a-col>
      <!-- CardWidth - (CardPadding(12) + LeftRightWidth(1) + ContentPadding(5)) * 2 -->
      <a-col flex="auto" class="px-1.5" :style="{ width: `${CardWidth - 36}px` }">
        <template v-if="node.desc">
          <ul class="pl-0 list-none mb-0 overflow-x-auto whitespace-nowrap">
            <li v-for="item in node.desc.split('\n')" :key="item">{{ item }}</li>
          </ul>
        </template>
        <template v-else>输入节点描述</template>
      </a-col>
      <a-col v-if="ndOutputs.length" flex="1px">
        <div class="relative">
          <div class="absolute z-50 left-0">
            <a-tag
              v-for="output in ndOutputs"
              :key="output.key"
              class="border-0 mr-0"
              :class="{ 'filled-output': output.value }"
              color="#108ee9"
            >
              <template v-if="output.value && output.value !== output.name">
                {{ output.name }}&nbsp;
                <RightOutlined />
                &nbsp;{{ output.value }}
              </template>
              <template v-else>
                {{ output.value || output.name }}&nbsp;
                <LogoutOutlined />
              </template>
            </a-tag>
          </div>
        </div>
      </a-col>
    </a-row>
  </a-card>
  <a-button
    type="primary"
    shape="circle"
    class="absolute z-10"
    :style="{
      left: `${addBtnPosLT[0]}px`,
      top: `${addBtnPosLT[1]}px`
    }"
    @click="$emit('click:addBtn', node.key)"
  >
    <template #icon><PlusOutlined /></template>
  </a-button>
  <svg
    v-if="node.key"
    class="absolute"
    :style="{
      width: `${arwBtmSvgSizeW}px`,
      height: `${node.btmSvgHgt}px`,
      left: `${arwBtmSvgPosLT[0]}px`,
      top: `${arwBtmSvgPosLT[1]}px`
    }"
  >
    <line
      stroke-width="2"
      :stroke="StokeColor"
      :x1="arwBtmSvgSizeW >> 1"
      :y1="0"
      :x2="arwBtmSvgSizeW >> 1"
      :y2="node.btmSvgHgt"
    />
    <template v-if="node.nexts.length > 1">
      <line
        stroke-width="4"
        :stroke="StokeColor"
        :x1="0"
        :y1="node.btmSvgHgt"
        :x2="arwBtmSvgSizeW"
        :y2="node.btmSvgHgt"
      />
    </template>
  </svg>
</template>

<script lang="ts" setup name="NodeCard">
/* eslint-disable @typescript-eslint/no-explicit-any */
import NodeInPnl from '@/types/ndInPnl'
import Node from '@/types/node'
import Variable from '@/types/variable'
import {
  AddBtnHlfWH,
  ArrowHlfHgt,
  CardHeight,
  CardHlfWid,
  CardWidth,
  StokeColor
} from '@/views/Flow'
import {
  BorderlessTableOutlined,
  FunctionOutlined,
  LoginOutlined,
  LogoutOutlined,
  MoreOutlined,
  PlusOutlined,
  RightOutlined
} from '@ant-design/icons-vue'
import { v4 as uuid } from 'uuid'
import { computed, defineEmits, defineProps, ref } from 'vue'
import { useStore } from 'vuex'

defineEmits(['click:card', 'click:addBtn', 'mouseenter', 'mouseleave'])
const props = defineProps({
  node: { type: NodeInPnl, default: new NodeInPnl() }
})
const store = useStore()
const nodeRef = ref()
const addBtnPosLT = computed(() =>
  props.node.key
    ? [
        props.node.posLT[0] + CardHlfWid - AddBtnHlfWH,
        props.node.posLT[1] + CardHeight + ArrowHlfHgt - AddBtnHlfWH
      ]
    : [(store.getters['service/width'] >> 1) - AddBtnHlfWH, 0]
)
const arwBtmSvgPosLT = computed(() => [
  props.node.posLT[0] - (arwBtmSvgSizeW.value >> 1) + CardHlfWid,
  props.node.posLT[1] + CardHeight
])
const arwTopSvgPosLT = computed(() => [
  props.node.posLT[0] - (arwTopSvgSizeW.value >> 1) + CardHlfWid,
  props.node.posLT[1] - ArrowHlfHgt
])
const arwTopSvgSizeW = computed(() => {
  if (props.node.ntype === 'endNode') {
    return getWidByNexts(store.getters['service/node'](props.node.relative))
  } else {
    return CardWidth
  }
})
const arwBtmSvgSizeW = computed(() => getWidByNexts(props.node as Node))
const color = computed(() => {
  switch (props.node.ntype) {
    case 'normal':
      return '#FFA500'
    case 'condition':
      return '#009E8E'
    case 'condNode':
      return '#009E8E'
    case 'traversal':
      return '#1047A9'
    case 'subNode':
      return '#FF6C00'
    default:
      return 'grey'
  }
})
const multiCond = computed(() => {
  const relative = store.getters['service/node'](props.node.relative)
  return props.node.ntype === 'endNode' && relative.nexts.length > 1
})
const ndOutputs = computed(() =>
  props.node.outputs.concat(
    props.node.ntype === 'subNode' && props.node.subFun
      ? [Variable.copy({ key: uuid(), name: props.node.subFun })]
      : []
  )
)

function getWidByNexts(node: Node): number {
  if (!node.nexts || !node.nexts.length) {
    return CardWidth
  }
  const lstIdx = node.nexts.length - 1
  const fstKey = node.nexts[0]
  const lstKey = node.nexts[lstIdx]
  const first = store.getters['service/node'](fstKey)
  const last = store.getters['service/node'](lstKey)
  if (!first || !first.posLT || !last || !last.posLT || last.posLT[0] <= first.posLT[0]) {
    return CardWidth
  }
  return last.posLT[0] - first.posLT[0]
}
function fmtCode(code: string): string {
  return code.replace('\n', '&#10;')
}
</script>

<style>
.filled-input {
  background: linear-gradient(to right, #87d068, #87d068 50%, #108ee9 51%, #108ee9 100%);
}

.filled-output {
  background: linear-gradient(to right, #108ee9, #108ee9 50%, #87d068 51%, #87d068 100%);
}
</style>
