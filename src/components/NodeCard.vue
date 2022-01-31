<template>
<svg v-if="node && node.previous" :style="{
  position: 'absolute',
  'z-index': -100,
  width: `${arwTopSvgSizeW}px`,
  height: `${ArrowHlfHgt}px`,
  left: `${arwTopSvgPosLT[0]}px`,
  top: `${arwTopSvgPosLT[1]}px`,
}">
  <line
    stroke-width="2"
    stroke="#f0f0f0"
    :x1="arwTopSvgSizeW >> 1" :y1="0"
    :x2="arwTopSvgSizeW >> 1" :y2="ArrowHlfHgt"
  />
  <template v-if="multiCond">
    <line
      stroke-width="4"
      stroke="#f0f0f0"
      :x1="0" :y1="0"
      :x2="arwTopSvgSizeW" :y2="0"
    />
  </template>
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
  :bodyStyle="{
    position: 'relative',
    border: '1px solid #f0f0f0',
  }"
  hoverable
  @click="$emit('click:card')"
  @mouseenter="$emit('mouseenter')"
  @mouseleave="$emit('mouseleave')"
>
  <template v-if="node.group" #extra>
    <span style="color: white">{{ node.group }}</span>
  </template>
  <a-row type="flex">
    <a-col flex="20px">
      <div style="position: relative">
        <div :style="{
          position: 'absolute',
          'z-index': 100,
          right: 0
        }">
          <a-tag
            v-for="input in node.inputs"
            :key="input.key"
            class="b-0"
            :class="{ 'filled-input': input.value }"
            color="#108ee9"
          >
            <template v-if="input.value">
              {{ input.value }}&nbsp;<RightOutlined />&nbsp;{{ input.name }}
            </template>
            <template v-else>
              <LoginOutlined />&nbsp;{{ input.name }}
            </template>
          </a-tag>
        </div>
      </div>
    </a-col>
    <a-col flex="auto">
      <a-card :bordered="false">
        <template v-if="node.desc">{{ node.desc }}</template>
        <template v-else-if="node.code">
          <pre class="mb-0">{{ node.code }}</pre>
        </template>
        <template v-else>输入节点描述</template>
      </a-card>
    </a-col>
    <a-col flex="20px">
      <div style="position: relative">
        <div :style="{
          position: 'absolute',
          'z-index': 100,
          left: '10px'
        }">
          <a-tag
            v-for="output in node.outputs"
            :key="output.key"
            class="b-0"
            color="#87d068"
          >
            {{ output.name }}&nbsp;
            <LogoutOutlined />
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
    top: `${addBtnPosLT[1]}px`
  }"
  @click="$emit('click:addBtn', node)"
>
  <template #icon><PlusOutlined/></template>
</a-button>
<svg v-if="!first" :style="{
  position: 'absolute',
  'z-index': -100,
  width: `${arwBtmSvgSizeW}px`,
  height: `${node.btmSvgHgt}px`,
  left: `${arwBtmSvgPosLT[0]}px`,
  top: `${arwBtmSvgPosLT[1]}px`,
}">
  <line
    stroke-width="2"
    stroke="#f0f0f0"
    :x1="arwBtmSvgSizeW >> 1" :y1="0"
    :x2="arwBtmSvgSizeW >> 1" :y2="node.btmSvgHgt"
  />
  <template v-if="nexts.length > 1">
    <line
      stroke-width="4"
      stroke="#f0f0f0"
      :x1="0" :y1="node.btmSvgHgt"
      :x2="arwBtmSvgSizeW" :y2="node.btmSvgHgt"
    />
  </template>
</svg>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { PlusOutlined, LoginOutlined, LogoutOutlined, RightOutlined } from '@ant-design/icons-vue'
import {
  AddBtnHlfWH,
  ArrowHeight,
  ArrowHlfHgt,
  CardWidth,
  CardHlfWid,
  Node,
  NodeTypeMapper,
  NodeType,
  CardMinHgt
} from '@/common'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'NodeCard',
  emits: [
    'click:card',
    'click:addBtn',
    'mouseenter',
    'mouseleave'
  ],
  components: {
    PlusOutlined,
    LoginOutlined,
    LogoutOutlined,
    RightOutlined
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
      (store.getters['service/width'] >> 1) - AddBtnHlfWH, 0
    ])
    const arwBtmSvgPosLT = computed(() => props.node ? [
      props.node.posLT[0] - (arwBtmSvgSizeW.value >> 1) + CardHlfWid,
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
      return next && next.key ? store.getters['service/node'](next.key) : undefined
    }).filter((node: any) => node))
    const multiCond = computed(() => {
      const relative = store.getters['service/node'](props.node.relative)
      return props.node.type === 'endNode' && relative.nexts.length > 1
    })
    const arwBtmSvgSizeW = computed(() => getWidByNexts(props.node as Node))
    const arwTopSvgPosLT = computed(() => [
      props.node.posLT[0] - (arwTopSvgSizeW.value >> 1) + CardHlfWid,
      props.node.posLT[1] - ArrowHlfHgt
    ])
    const arwTopSvgSizeW = computed(() => {
      if (props.node.type === 'endNode') {
        return getWidByNexts(store.getters['service/node'](props.node.relative))
      } else {
        return CardWidth
      }
    })

    onMounted(async () => {
      if (!props.node) {
        return
      }
      store.commit('service/SET_ND_SIZE', {
        ndKey: props.node.key,
        size: nodeRef.value ? [
          nodeRef.value.$el.clientWidth,
          nodeRef.value.$el.clientHeight
        ] : [CardWidth, CardMinHgt]
      })
      await store.dispatch('service/refresh')
    })

    function getKey (obj: { key: string } | string): string {
      return typeof obj === 'string' ? obj : obj.key
    }
    function getWidByNexts (node: Node): number {
      if (!node.nexts || !node.nexts.length) {
        return CardWidth
      }
      const lstIdx = node.nexts.length - 1
      const fstKey = getKey(node.nexts[0])
      const lstKey = getKey(node.nexts[lstIdx])
      const first = store.getters['service/node'](fstKey)
      const last = store.getters['service/node'](lstKey)
      if (!first || !first.posLT || !last ||!last.posLT
      || last.posLT[0] <= first.posLT[0]) {
        return CardWidth
      }
      return last.posLT[0] - first.posLT[0]
    }
    function fmtCode (code: string): string {
      return code.replaceAll('\n', '&#10;')
    }
    return {
      CardWidth,
      CardHlfWid,
      CardMinHgt,
      ArrowHeight,
      ArrowHlfHgt,
      title,
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
</style>
