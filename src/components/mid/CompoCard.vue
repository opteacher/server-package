<template>
  <div
    :draggable="true"
    @dragover="(e: any) => e.preventDefault()"
    @dragenter="(e: DragEvent) => $emit('dragenter', cmpIns, e)"
    @dragleave="() => $emit('dragleave', cmpIns)"
    @drop.stop="(e: DragEvent) => $emit('drop', cmpIns, e)"
  >
    <div
      @click.stop="$emit('click', cmpIns)"
      :style="{
        position: 'absolute',
        'z-index': 998,
        cursor: 'pointer',
        width: cmpIns.style.width,
        height: cmpIns.style.height,
        border: actKey === cmpIns.key ? '2px solid #1890ff' : 'none'
      }"
    />
    <CompoIns :cmpIns="cmpIns">
      <CompoCard
        v-for="child in cmpIns.children"
        :key="child.key"
        :cmpIns="child"
        :actKey="actKey"
        @click="$emit('click', child)"
        @dragenter="(e: DragEvent) => $emit('dragenter', child, e)"
        @dragleave="() => $emit('dragleave', child)"
        @drop="(e: DragEvent) => $emit('drop', child, e)"
        @refresh="$emit('refresh')"
      />
    </CompoIns>
  </div>
</template>

<script lang="ts">
import CmpIns from '@/types/cmpIns'
import { defineComponent, onMounted, reactive } from 'vue'
import CompoIns from './CompoIns.vue'
import { waitFor } from '@/utils'

export default defineComponent({
  name: 'CompoCard',
  components: {
    CompoIns
  },
  emits: ['refresh', 'click', 'dragenter', 'dragleave', 'drop'],
  props: {
    cmpIns: { type: CmpIns, required: true },
    actKey: { type: String, required: true }
  },
  setup(props) {
    const ciState = reactive(props.cmpIns)
    const rsvObs = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      const rect = entries[0].contentRect
      ciState.style.width = `${rect.width}px`
      ciState.style.height = `${rect.height}px`
    })

    onMounted(async () => {
      const el = await waitFor(props.cmpIns.key)
      if (!el) {
        return
      }
      rsvObs.observe(el as HTMLElement)
    })
    return {
      CmpIns
    }
  }
})
</script>
