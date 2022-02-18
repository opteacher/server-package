<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="model.name"
      :sub-title="model.desc"
      @back="() => router.go(-1)"
    ></a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'FormLayout',
  setup() {
    const store = useStore()
    const router = useRouter()
    const model = computed(() => store.getters['model/ins'])

    onMounted(async () => await store.dispatch('model/refresh'))

    return {
      store,
      router,
      model
    }
  }
})
</script>
