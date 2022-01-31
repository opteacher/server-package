<template>
<div :style="{
  position: 'fixed',
  bottom: '50px',
  right: '100px',
  'z-index': 1000,
  'background-color': 'white'
}">
  <a-collapse v-if="$store.getters['service/deps'].length">
    <a-collapse-panel class="collapse-ptb-0" header="依赖模块：">
      <a-list :data-source="$store.getters['service/deps']">
        <template #renderItem="{ item: dep }">
          <a-list-item>
            <template #actions>
              <a-tag
                v-for="exp in dep.exports"
                :key="exp" color="#87d068"
              >
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
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'DependenciesPanel'
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
