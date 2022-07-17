<template>
  <div
    :style="{
      position: 'fixed',
      bottom: '50px',
      right: '100px',
      'z-index': 1000,
      'background-color': 'white'
    }"
  >
    <a-collapse v-if="deps.length">
      <a-collapse-panel class="collapse-ptb-0">
        <template #header>
          依赖模块：
          <a-badge :count="deps.length" :number-style="{ backgroundColor: '#1890ff' }" />
        </template>
        <a-list :data-source="deps">
          <template #renderItem="{ item: dep }">
            <a-list-item>
              <template #actions>
                <a-tag v-for="exp in dep.exports" :key="exp" color="#87d068">
                  {{ exp }}
                </a-tag>
              </template>
              -&nbsp;{{ dep.name }}
            </a-list-item>
          </template>
        </a-list>
      </a-collapse-panel>
    </a-collapse>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'DependenciesPanel',
  setup() {
    const store = useStore()
    const deps = computed(() => [])

    onMounted(() => {
      console.log(deps.value)
    })

    return {
      deps
    }
  }
})
</script>

<style lang="less">
.collapse-ptb-0 {
  .ant-collapse-content-box {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}
</style>
