<template>
  <a-layout
    class="h-full"
    @dragover.stop="(e: any) => e.preventDefault()"
    @drop.stop="onFieldDropDown"
  >
    <a-layout-sider width="200" v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="h-8 m-4 bg-gray-700" />
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="onItemSelected">
        <a-menu-item :key="`/project/${pid}/model/${mid}/form`" class="mt-0">
          <form-outlined />
          <span>表单</span>
        </a-menu-item>
        <a-menu-item :key="`/project/${pid}/model/${mid}/table`">
          <table-outlined />
          <span>表项</span>
        </a-menu-item>
        <a-menu-item :key="`/project/${pid}/model/${mid}/demo`">
          <desktop-outlined />
          <span>演示</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
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
      <a-layout class="flex flex-col">
        <a-space class="mx-6 mt-4">
          <a-button @click="$router.go(-1)">
            <template #icon><arrow-left-outlined /></template>
          </a-button>
          <a-breadcrumb>
            <a-breadcrumb-item><a href="/">项目</a></a-breadcrumb-item>
            <a-breadcrumb-item>
              <a :href="`/server-package/project/${pid}`">
                {{ pjtName }}
              </a>
            </a-breadcrumb-item>
            <a-breadcrumb-item>
              <a :href="`/server-package/project/${pid}`">模型</a>
            </a-breadcrumb-item>
            <a-breadcrumb-item>
              <a :href="`/server-package/project/${pid}/model/${mid}`">{{ mdlName }}</a>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="active.endsWith('form')">表单</a-breadcrumb-item>
            <a-breadcrumb-item v-else-if="active.endsWith('table')">表项</a-breadcrumb-item>
            <a-breadcrumb-item v-else-if="active.endsWith('demo')">中台演示</a-breadcrumb-item>
          </a-breadcrumb>
        </a-space>
        <a-layout-content class="flex-auto mx-5 my-4 p-6 bg-white overflow-y-auto">
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup name="DesignLayout">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  UserOutlined,
  FormOutlined,
  TableOutlined,
  ArrowLeftOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DesktopOutlined
} from '@ant-design/icons-vue'
import { onFieldDropDown } from '../views/Form'


defineProps({
  active: { type: String, required: true }
})
const router = useRouter()
const route = useRoute()
const store = useStore()
const pid = route.params.pid
const mid = route.params.mid
const pjtName = computed(() => store.getters['project/ins'].name)
const mdlName = computed(() => store.getters['model/ins'].name)
const collapsed = ref<boolean>(false)

function onItemSelected({ key }: { key: any }) {
  router.push(key)
}
</script>
