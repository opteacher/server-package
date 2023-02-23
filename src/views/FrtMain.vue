<template>
  <LytProject :active="`project/${pid}/frt`">
    <div>abcd</div>
  </LytProject>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import LytProject from '@/layouts/LytProject.vue';
import { useRoute } from 'vue-router';

export default defineComponent({
  name: 'FrtMain',
  components: {
    LytProject
  },
  setup() {
    const route = useRoute()
    const pid = computed(() => route.params.pid)

    return {
      pid
    }
  }
})
</script>
