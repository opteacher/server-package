<template>
  <a-button
    class="w-100"
    :draggable="true"
    @dragstart="(e: any) => e.dataTransfer.setData('text/plain', `compo_${compo.name}`)"
  >
    {{ compo.name }}
  </a-button>
</template>

<script lang="ts">
import Compo from '@/types/compo'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Form',
  props: {
    compo: { type: Compo, required: true }
  }
})
</script>
