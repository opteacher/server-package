<template>
  <div
    v-show="locVars.length"
    :style="{
      position: 'fixed',
      width: '15vw',
      top: '150px',
      right: '50px',
      'z-index': 1000,
      'background-color': 'white'
    }"
  >
    <a-list size="small" bordered :data-source="locVars">
      <template #header>
        <h4 class="mb-0">可用变量：</h4>
      </template>
      <template #renderItem="{ item: locVar }">
        <a-list-item>-&nbsp;{{ locVar.value || locVar.name }}</a-list-item>
      </template>
    </a-list>
  </div>
</template>

<script lang="ts">
import { computed } from 'vue'
import { defineComponent } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'VariablesPanel',
  setup() {
    const store = useStore()
    const locVars = computed(() => store.getters['service/locVars'])

    return {
      locVars
    }
  }
})
</script>
