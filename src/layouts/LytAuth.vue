<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="project.name"
      @back="() => $router.go(-1)"
    >
      <!-- <a-descriptions size="small" :column="5">
        <a-descriptions-item v-for="prop in model.props" :key="prop.key" :label="prop.name">
          {{ prop.type }}
        </a-descriptions-item>
      </a-descriptions> -->
    </a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'AuthorizationLayout',
  setup() {
    const store = useStore()
    const project = computed(() => store.getters['project/ins'])

    onMounted(() => store.dispatch('project/refresh'))
    return {
      project
    }
  }
})
</script>
