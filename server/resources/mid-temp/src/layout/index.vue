<template>
  <a-layout class="h-100">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div
        :style="{
          height: '10%',
          cursor: 'pointer',
          'background-color': navigate.theme === 'dark' ? '#001529' : 'white'
        }"
      />
      <a-menu
        class="h-100"
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
        <a-row>
          <a-col :span="12">
            <menu-unfold-outlined
              v-if="collapsed"
              class="trigger"
              @click="() => (collapsed = !collapsed)"
            />
            <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
          </a-col>
          <a-col :span="12" style="text-align: right; padding-right: 24px">
            <a-popover placement="bottomRight">
              <template #content>
                <a-button class="w-100" type="primary" danger @click="onLogout">退出登录</a-button>
              </template>
              <a-avatar
                size="large"
                class="p-5 avatar-float"
                src="https://joeschmoe.io/api/v1/random"
              />
            </a-popover>
          </a-col>
        </a-row>
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
        <div class="h-100" ref="container"><slot /></div>
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

.site-layout .site-layout-background {
  background: #fff;
}

.avatar-float {
  border: 2px solid white;
}
.avatar-float:hover {
  cursor: pointer;
  border: 2px solid #1890ff;
}
</style>
