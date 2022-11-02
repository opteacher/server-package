<template>
  <svg
    v-if="node && node.previous"
    :style="{
      position: 'absolute',
      width: `${arwTopSvgSizeW}px`,
      height: `${ArrowHlfHgt}px`,
      left: `${arwTopSvgPosLT[0]}px`,
      top: `${arwTopSvgPosLT[1]}px`
    }"
  >
    <line
      stroke-width="2"
      stroke="#f0f0f0"
      :x1="arwTopSvgSizeW >> 1"
      :y1="0"
      :x2="arwTopSvgSizeW >> 1"
      :y2="ArrowHlfHgt"
    />
    <template v-if="multiCond">
      <line stroke-width="4" stroke="#f0f0f0" :x1="0" :y1="0" :x2="arwTopSvgSizeW" :y2="0" />
    </template>
  </svg>
  <a-card
    v-if="ndKey"
    :id="ndKey"
    size="small"
    ref="nodeRef"
    :bordered="false"
    :style="{
      position: 'absolute',
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
      border: '1px solid #f0f0f0'
    }"
    hoverable
    @click="$emit('click:card')"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
  >
    <template #title>
      # {{ node.title }}&nbsp;
      <a-tag v-if="node.ntype === 'normal' && node.isFun">函数式</a-tag>
      <template v-else-if="node.ntype === 'traversal'">
        <a-tag v-if="node.isAwait">await</a-tag>
        <a-tag v-else-if="node.isForIn">for……in循环</a-tag>
      </template>
    </template>
    <template v-if="node.group" #extra>
      <span style="color: white">{{ node.group }}</span>
    </template>
    <a-row type="flex">
      <a-col v-if="node.inputs.length" flex="20px">
        <div style="position: relative">
          <div
            :style="{
              position: 'absolute',
              'z-index': 100,
              right: 0,
              'text-align': 'right'
            }"
          >
            <a-tag
              v-for="input in node.inputs"
              :key="input.key"
              class="b-0"
              :class="{ 'filled-input': input.value }"
              color="#108ee9"
            >
              <template v-if="input.value">
                {{ input.value }}&nbsp;
                <RightOutlined />
                &nbsp;{{ input.name }}
              </template>
              <template v-else>
                <LoginOutlined />
                &nbsp;{{ input.name }}
              </template>
            </a-tag>
          </div>
        </div>
      </a-col>
      <a-col flex="auto">
        <template v-if="node.desc">
          <ul class="unstyled-list">
            <li v-for="item in node.desc.split('\n')" :key="item">{{ item }}</li>
          </ul>
        </template>
        <template v-else>输入节点描述</template>
      </a-col>
      <a-col v-if="node.outputs.length" flex="20px">
        <div style="position: relative">
          <div
            :style="{
              position: 'absolute',
              'z-index': 100,
              left: 0
            }"
          >
            <a-tag
              v-for="output in node.outputs"
              :key="output.key"
              class="b-0"
              :class="{ 'filled-output': output.value }"
              color="#108ee9"
            >
              <template v-if="output.value">
                {{ output.name }}&nbsp;
                <RightOutlined />
                &nbsp;{{ output.value }}
              </template>
              <template v-else>
                {{ output.name }}&nbsp;
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
    :style="{
      position: 'absolute',
      left: `${addBtnPosLT[0]}px`,
      top: `${addBtnPosLT[1]}px`,
      'z-index': 1
    }"
    @click="$emit('click:addBtn', node.key)"
  >
    <template #icon><PlusOutlined /></template>
  </a-button>
  <svg
    v-if="ndKey"
    :style="{
      position: 'absolute',
      width: `${arwBtmSvgSizeW}px`,
      height: `${node.btmSvgHgt}px`,
      left: `${arwBtmSvgPosLT[0]}px`,
      top: `${arwBtmSvgPosLT[1]}px`
    }"
  >
    <line
      stroke-width="2"
      stroke="#f0f0f0"
      :x1="arwBtmSvgSizeW >> 1"
      :y1="0"
      :x2="arwBtmSvgSizeW >> 1"
      :y2="node.btmSvgHgt"
    />
    <template v-if="nexts.length > 1">
      <line
        stroke-width="4"
        stroke="#f0f0f0"
        :x1="0"
        :y1="node.btmSvgHgt"
        :x2="arwBtmSvgSizeW"
        :y2="node.btmSvgHgt"
      />
    </template>
  </svg>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { PlusOutlined, LoginOutlined, LogoutOutlined, RightOutlined } from '@ant-design/icons-vue'
import Node from '@/types/node'
import {
  CardMinHgt,
  AddBtnHlfWH,
  ArrowHeight,
  ArrowHlfHgt,
  CardWidth,
  CardHlfWid,
  ndCdEmitter
} from '@/views/Flow'
import { useStore } from 'vuex'
import NodeInPnl from '@/types/ndInPnl'

export default defineComponent({
  name: 'NodeCard',
  emits: ['click:card', 'click:addBtn', 'mouseenter', 'mouseleave'],
  components: {
    PlusOutlined,
    LoginOutlined,
    LogoutOutlined,
    RightOutlined
  },
  props: {
    ndKey: { type: String, default: '' }
  },
  setup(props) {
    const store = useStore()
    const nodeRef = ref()
    const node = reactive(
      props.ndKey
        ? store.getters['service/node'](props.ndKey)
        : Object.assign(Node.copy({ ntype: 'normal' }), {
            posLT: [(store.getters['service/width'] >> 1) - CardHlfWid, 0],
            size: [0, 0],
            btmSvgHgt: ArrowHlfHgt
          })
    )
    const addBtnPosLT = computed(() =>
      props.ndKey
        ? [
            node.posLT[0] + CardHlfWid - AddBtnHlfWH,
            node.posLT[1] + node.size[1] + ArrowHlfHgt - AddBtnHlfWH
          ]
        : [(store.getters['service/width'] >> 1) - AddBtnHlfWH, 0]
    )
    const arwBtmSvgPosLT = computed(() => [
      node.posLT[0] - (arwBtmSvgSizeW.value >> 1) + CardHlfWid,
      node.posLT[1] + node.size[1]
    ])
    const arwTopSvgPosLT = computed(() => [
      node.posLT[0] - (arwTopSvgSizeW.value >> 1) + CardHlfWid,
      node.posLT[1] - ArrowHlfHgt
    ])
    const arwTopSvgSizeW = computed(() => {
      if (node.ntype === 'endNode') {
        return getWidByNexts(store.getters['service/node'](node.relative))
      } else {
        return CardWidth
      }
    })
    const arwBtmSvgSizeW = computed(() => getWidByNexts(node))
    const color = computed(() => {
      switch (node.ntype) {
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
    const nexts = computed(() =>
      node.nexts.map((next: Node) => store.getters['service/node'](next))
    )
    const multiCond = computed(() => {
      const relative = store.getters['service/node'](node.relative)
      return node.ntype === 'endNode' && relative.nexts.length > 1
    })

    onMounted(refresh)
    ndCdEmitter.on('refresh', refresh)

    async function refresh() {
      if (!props.ndKey || !(props.ndKey in store.getters['service/nodes'])) {
        return
      }
      NodeInPnl.copy(store.getters['service/node'](props.ndKey), node)
    }
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
      return code.replaceAll('\n', '&#10;')
    }
    return {
      CardWidth,
      CardHlfWid,
      CardMinHgt,
      ArrowHeight,
      ArrowHlfHgt,
      node,
      color,
      nexts,
      multiCond,
      nodeRef,
      addBtnPosLT,
      arwBtmSvgPosLT,
      arwBtmSvgSizeW,
      arwTopSvgPosLT,
      arwTopSvgSizeW,

      fmtCode
    }
  }
})
</script>

<style lang="less" scoped>
.filled-input {
  background: linear-gradient(to right, #87d068, #87d068 50%, #108ee9 51%, #108ee9 100%);
}

.filled-output {
  background: linear-gradient(to right, #108ee9, #108ee9 50%, #87d068 51%, #87d068 100%);
}
</style>
