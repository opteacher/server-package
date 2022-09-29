<template>
  <a-row v-if="cmpIns.ctype === 'Row'" :id="cmpIns.key">
    <template v-if="!cmpIns.children.length">这是个横向容器</template>
    <slot v-else />
  </a-row>
  <a-col v-else-if="cmpIns.ctype === 'Col'" :id="cmpIns.key">
    <template v-if="!cmpIns.children.length">这是个纵向容器</template>
    <slot v-else />
  </a-col>
  <a-button v-else-if="cmpIns.ctype === 'Button'" :id="cmpIns.key">这是个按钮</a-button>
  <a-card v-else-if="cmpIns.ctype === 'Card'" :id="cmpIns.key" title="标题">这是个卡片</a-card>
  <img
    v-else-if="cmpIns.ctype === 'Image'"
    :id="cmpIns.key"
    src="https://cdn.seovx.com/?mom=302"
    :style="{ 'max-width': '100%', height: 'auto' }"
  />
</template>

<script lang="ts">
import CmpIns from '@/types/cmpIns'
import { defineComponent, onMounted } from 'vue'

export default defineComponent({
  name: 'CompoIns',
  props: {
    cmpIns: { type: CmpIns, required: true }
  }
})
</script>
