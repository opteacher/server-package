<template>
  <a-card
    hoverable
    size="small"
    :draggable="true"
    @dragstart="e => e.dataTransfer?.setData('text/plain', `compo_${compo.name}`)"
  >
    <template v-if="compo.cover" #cover>
      <img class="img-fluid" alt="example" :src="compo.cover" />
    </template>
    <a-card-meta :title="compo.name"></a-card-meta>
  </a-card>
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
