<template>
  <a-layout class="h-full">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div
        class="cursor-pointer"
        :style="{
          'background-color': navigate.theme === 'dark' ? '#001529' : 'white'
        }"
      />
      <a-menu
        class="h-full"
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
      <a-layout-header class="bg-white p-0 flex justify-between">
        <menu-unfold-outlined
          v-if="collapsed"
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        />
        <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
        <a-popover placement="bottomRight">
          <template #content>
            <a-button class="w-full" type="primary" danger @click="onLogout">退出登录</a-button>
          </template>
          <a-avatar size="large" class="border-2 cursor-pointer hover:border-primary mr-6">
            <template #icon>
              <UserOutlined />
            </template>
          </a-avatar>
        </a-popover>
      </a-layout-header>
      <a-layout-content class="flex-auto mx-6 mt-4 p-6 bg-white overflow-y-hidden">
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
import { useRouter } from 'vue-router'
import { reqAll } from '../utils'
import { message } from 'ant-design-vue'

export default defineComponent({
  name: 'IndexLayout',
  emits: ['change'],
  components: antdIcons,
  setup(_props, { emit }) {
    const router = useRouter()
    const container = ref()
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

    onMounted(async () => {
      const unaccessible = []
      for (const model of models) {
        try {
          await reqAll(model.name, { query: { limit: 1 } })
        } catch (e) {
          console.log(e)
          unaccessible.push(model.name)
        }
      }
      for (const mname of unaccessible) {
        models.splice(
          models.findIndex((model: Model) => model.name === mname),
          1
        )
      }
      if (!models.length) {
        message.error('没有访问权限！', undefined, () => {
          router.replace('//*return project.name*//login')
        })
        localStorage.removeItem('token')
        return
      }
      emit('change', active.value)
    })

    function onItemSelected({ key }: { key: string }) {
      active.value = key
      emit('change', key)
    }
    function onLogout() {
      localStorage.removeItem('token')
      router.replace('//*return project.name*//login')
    }
    return {
      active,
      container,
      navigate,
      collapsed: ref<boolean>(false),
      models,
      onItemSelected,
      onLogout
    }
  }
})
</script>
