<template>
  <a-layout class="h-100">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo" />
      <a-menu
        :selectedKeys="[active]"
        :theme="navigate.theme"
        mode="inline"
        @select="onItemSelected"
      >
        <a-menu-item v-for="model in models" :key="model.name">
          <keep-alive>
            <component :is="model.icon" />
          </keep-alive>
          <span>{{ model.label || model.name }}</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0">
        <menu-unfold-outlined
          v-if="collapsed"
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        />
        <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
      </a-layout-header>
      <a-layout-content
        :style="{
          margin: '24px 16px',
          padding: '24px',
          background: '#fff',
          minHeight: '280px',
          overflowY: 'auto'
        }"
      >
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import * as antdIcons from '@ant-design/icons-vue/lib/icons'
import { defineComponent, onMounted, reactive, ref } from 'vue'
import Model from '../types/model'
import MidNav from '../types/midNav'

export default defineComponent({
  name: 'IndexLayout',
  emits: ['change'],
  components: antdIcons,
  setup(_props, { emit }) {
    const active = ref(
      '' /*return project.models.length ? `\'${project.models[0].name}\'` : '\'\''*/
    )
    const navigate = reactive(
      MidNav.copy(
        '' /*return `{ theme: \'${project.middle.navigate.theme}\', logo: \'${project.middle.navigate.logo.length ? project.middle.navigate.logo[0] : ''}\' }`*/
      )
    )
    const models = reactive([
      /*return project.models.map(model => `{ icon: \'${model.icon}\', name: \'${model.name}\', label: \'${model.label}\' }`).join(',\n      ')*/
    ] as Model[])

    onMounted(() => {
      emit('change', active.value)
    })

    function onItemSelected({ key }: { key: any }) {
      emit('change', key)
    }
    return {
      active,
      navigate,
      collapsed: ref<boolean>(false),
      models,
      onItemSelected
    }
  }
})
</script>

<style>
.trigger {
  font-size: 18px;
  line-height: 64px;
  padding: 0 24px;
  cursor: pointer;
  transition: color 0.3s;
}

.trigger:hover {
  color: #1890ff;
}

.logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.3);
  margin: 16px;
}

.site-layout .site-layout-background {
  background: #fff;
}
</style>
