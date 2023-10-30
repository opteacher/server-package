<template>
  <a-layout class="h-full">
    <a-layout-sider width="300" v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="h-8 m-4 bg-gray-700" />
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="onItemSelected">
        <a-menu-item key="dash" class="mt-0">
          <DashboardOutlined />
          <span>总览</span>
        </a-menu-item>
        <a-menu-item key="home">
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
          class="text-xl px-6 py-0 cursor-pointer transition hover:text-primary"
          @click="() => (collapsed = !collapsed)"
        />
        <menu-fold-outlined
          v-else
          class="text-xl px-6 py-0 cursor-pointer transition hover:text-primary"
          @click="() => (collapsed = !collapsed)"
        />
        <a-popover placement="bottomRight">
          <template #content>
            <a-button class="w-full" type="primary" danger>退出登录</a-button>
          </template>
          <a-avatar size="large" class="border-2 cursor-pointer hover:border-primary mr-6">
            <template #icon>
              <UserOutlined />
            </template>
          </a-avatar>
        </a-popover>
      </a-layout-header>
      <a-layout-content class="flex-auto mx-5 my-4 p-6 bg-white overflow-y-auto">
        <slot />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup name="MainLayout">
import {
  DashboardOutlined,
  UserOutlined,
  ProjectOutlined,
  DatabaseOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  PartitionOutlined,
  BuildOutlined
} from '@ant-design/icons-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps({
  active: { type: String, required: true }
})
const router = useRouter()
const collapsed = ref<boolean>(false)

function onItemSelected({ key }: { key: any }) {
  router.push(key)
}
</script>
