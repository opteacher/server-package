<template>
<div class="flow-container">
  <a-page-header
    class="demo-page-header"
    style="border: 1px solid rgb(235, 237, 240)"
    :title="route.method"
    :sub-title="route.path"
    @back="() => router.go(-1)"
  >
  </a-page-header>
  <slot/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
export default defineComponent({
  name: 'FlowDesign',
  setup () {
    const store = useStore()
    const router = useRouter()
    const route = computed(() => store.getters['route/route'])
    return {
      route,
      router
    }
  }
})
</script>

<style lang="less">
.flow-container {
  padding: 50px 100px;
}
</style>
