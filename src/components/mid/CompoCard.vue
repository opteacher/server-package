<template>
  <div
    :draggable="true"
    @dragover="(e: any) => e.preventDefault()"
    @dragenter="() => CmpIns.copy(cmpIns, actCmp)"
    @drageleave="() => actCmp.reset()"
    @drop.stop="onDropOnContainer"
  >
    <div
      @click.stop="CmpIns.copy(cmpIns, actCmp)"
      :style="{
        position: 'absolute',
        'z-index': 998,
        cursor: 'pointer',
        width: cmpIns.style.width,
        height: cmpIns.style.height,
        border: cmpIns.key === actCmp.key ? '2px solid #1890ff' : 'none'
      }"
    />
    <CompoIns :cmpIns="cmpIns">
      <CompoCard
        v-for="child in cmpIns.children"
        :key="child.key"
        :pid="pid"
        :compos="compos"
        :cmpIns="child"
        :actCmp="actCmp"
      />
    </CompoIns>
  </div>
</template>

<script lang="ts">
import { pjtAPI } from '@/apis'
import CmpIns from '@/types/cmpIns'
import Compo from '@/types/compo'
import { defineComponent, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import CompoIns from './CompoIns.vue'
import { v4 as uuidv4 } from 'uuid'
import { waitFor } from '@/utils'

export default defineComponent({
  name: 'CompoCard',
  components: {
    CompoIns
  },
  emits: ['refresh'],
  props: {
    pid: { type: String, default: '' },
    compos: { type: Array, required: true },
    cmpIns: { type: CmpIns, required: true },
    actCmp: { type: CmpIns, required: true }
  },
  setup(props, { emit }) {
    const route = useRoute()
    const pid = props.pid || (route.params.pid as string)
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

    async function onDropOnContainer(e: DragEvent) {
      if (!e.dataTransfer) {
        return
      }
      const cmpName = e.dataTransfer.getData('text/plain')
      await pjtAPI.middle.dashboard.compo.child.opera(
        pid,
        props.actCmp.key,
        'children',
        new CmpIns(props.compos.find((cmp: any) => cmp.name === cmpName) as Compo, uuidv4()),
        'append',
        () => Promise.resolve(emit('refresh'))
      )
    }
    return {
      CmpIns,

      onDropOnContainer
    }
  }
})
</script>
