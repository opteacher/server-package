<template>
  <a-layout class="h-full">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo" />
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="onItemSelected">
        <a-menu-item key="home" class="mt-0">
          <project-outlined />
          <span>项目</span>
        </a-menu-item>
        <a-menu-item key="database">
          <database-outlined />
          <span>数据库</span>
        </a-menu-item>
        <a-menu-item key="dependency">
          <partition-outlined />
          <span>模组</span>
        </a-menu-item>
        <a-menu-item key="component">
          <build-outlined />
          <span>组件</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout class="flex flex-col">
      <a-layout-header class="bg-white p-0 flex items-center justify-between">
        <menu-unfold-outlined
          v-if="collapsed"
          class="trigger"
          @click="() => (collapsed = !collapsed)"
        />
        <menu-fold-outlined v-else class="trigger" @click="() => (collapsed = !collapsed)" />
        <a-popover placement="bottomRight">
          <template #content>
            <a-button class="w-full" type="primary" danger>退出登录</a-button>
          </template>
          <a-avatar
            size="large"
            class="p-5 border-2 cursor-pointer hover:border-primary mr-6"
            src="https://joeschmoe.io/api/v1/random"
          />
        </a-popover>
      </a-layout-header>
      <a-layout-content class="flex-auto mx-6 mt-4 p-6 bg-white overflow-y-hidden">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import {
  ProjectOutlined,
  DatabaseOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  PartitionOutlined,
  BuildOutlined
} from '@ant-design/icons-vue'
import { defineComponent, ref } from 'vue'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'MainLayout',
  components: {
    ProjectOutlined,
    DatabaseOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    PartitionOutlined,
    BuildOutlined
  },
  props: {
    active: { type: String, required: true }
  },
  setup() {
    const router = useRouter()

    function onItemSelected({ key }: { key: any }) {
      router.push(`/server-package/${key}`)
    }
    return {
      collapsed: ref<boolean>(false),
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
