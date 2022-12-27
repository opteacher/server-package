<template>
  <a-layout class="h-full">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo" />
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="onItemSelected">
        <a-menu-item :key="`project/${pid}`" class="mt-0">
          <project-outlined />
          <span>项目</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/model/${mid}`" disabled>
          <appstore-outlined />
          <span>模型</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/auth`">
          <audit-outlined />
          <span>权限</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/mid/login`">
          <layout-outlined />
          <span>中台</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>
    <a-layout>
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
      <a-layout class="flex flex-col">
        <a-space class="mx-6 my-4">
          <a-button @click="$router.push('/server-package')">
            <template #icon><home-outlined /></template>
          </a-button>
          <a-breadcrumb>
            <a-breadcrumb-item><a href="/server-package/">项目</a></a-breadcrumb-item>
            <a-breadcrumb-item>
              <a
                v-if="active.includes('/model/') || active.endsWith('auth')"
                :href="`/server-package/project/${pid}`"
              >
                {{ pjtName }}
              </a>
              <span v-else>{{ pjtName }}</span>
            </a-breadcrumb-item>
            <template v-if="active.includes('/model/')">
              <a-breadcrumb-item>模型</a-breadcrumb-item>
              <a-breadcrumb-item>{{ mdlName }}</a-breadcrumb-item>
            </template>
            <a-breadcrumb-item v-else-if="active.endsWith('auth')">权限</a-breadcrumb-item>
          </a-breadcrumb>
        </a-space>
        <a-layout-content class="flex-auto mx-6 mt-4 p-6 bg-white overflow-y-hidden">
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import {
  ProjectOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  AppstoreOutlined,
  AuditOutlined,
  HomeOutlined,
  LayoutOutlined
} from '@ant-design/icons-vue'
import { computed, defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default defineComponent({
  name: 'MainLayout',
  components: {
    ProjectOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    AppstoreOutlined,
    AuditOutlined,
    HomeOutlined,
    LayoutOutlined
  },
  props: {
    active: { type: String, required: true }
  },
  setup() {
    const router = useRouter()
    const route = useRoute()
    const store = useStore()
    const pid = route.params.pid
    const mid = route.params.mid
    const sid = route.params.sid
    const pjtName = computed(() => store.getters['project/ins'].name)
    const mdlName = computed(() => store.getters['model/ins'].name)

    function onItemSelected({ key }: { key: any }) {
      router.push(`/server-package/${key}`)
    }
    return {
      pid,
      mid,
      sid,
      pjtName,
      mdlName,
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
