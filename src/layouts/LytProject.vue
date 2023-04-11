<template>
  <a-layout class="h-full">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="h-8 m-4 bg-gray-700" />
      <a-menu
        :selectedKeys="[active]"
        theme="dark"
        mode="inline"
        @select="onItemSelected"
        v-model:openKeys="expanded"
      >
        <a-sub-menu key="project" title="项目">
          <template #icon>
            <project-outlined />
          </template>
          <a-menu-item :key="`project/${pid}`">
            <span>{{ pjtName }}</span>
          </a-menu-item>
          <a-menu-item-group key="models">
            <template #icon>
              <appstore-outlined />
            </template>
            <template #title>模型</template>
            <a-menu-item v-for="model in models" :key="`project/${pid}/model/${model.key}`">
              {{ model.name }}
            </a-menu-item>
          </a-menu-item-group>
        </a-sub-menu>
        <a-menu-item v-if="!isFront" :key="`project/${pid}/auth`">
          <audit-outlined />
          <span>权限</span>
        </a-menu-item>
        <a-sub-menu v-if="!isFront" key="middle" title="中台">
          <template #icon>
            <layout-outlined />
          </template>
          <a-menu-item :key="`project/${pid}/mid/login`">
            <login-outlined />
            <span>登录页</span>
          </a-menu-item>
          <a-menu-item :key="`project/${pid}/mid/navigate`">
            <hdd-outlined />
            <span>导航栏</span>
          </a-menu-item>
          <a-menu-item :key="`project/${pid}/mid/dashboard`">
            <dashboard-outlined />
            <span>首页</span>
          </a-menu-item>
        </a-sub-menu>
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
            <template v-else-if="active.endsWith('mid/login')">
              <a-breadcrumb-item>中台</a-breadcrumb-item>
              <a-breadcrumb-item>登录页</a-breadcrumb-item>
            </template>
            <template v-else-if="active.endsWith('mid/navigate')">
              <a-breadcrumb-item>中台</a-breadcrumb-item>
              <a-breadcrumb-item>导航栏</a-breadcrumb-item>
            </template>
            <template v-else-if="active.endsWith('mid/dashboard')">
              <a-breadcrumb-item>中台</a-breadcrumb-item>
              <a-breadcrumb-item>首页</a-breadcrumb-item>
            </template>
          </a-breadcrumb>
        </a-space>
        <a-layout-content class="flex-auto mx-5 my-4 p-6 bg-white overflow-y-auto">
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
  AuditOutlined,
  HomeOutlined,
  LayoutOutlined,
  UserOutlined,
  LoginOutlined,
  HddOutlined,
  DashboardOutlined,
  AppstoreOutlined
} from '@ant-design/icons-vue'
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'

export default defineComponent({
  name: 'MainLayout',
  components: {
    ProjectOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    AuditOutlined,
    HomeOutlined,
    LayoutOutlined,
    UserOutlined,
    LoginOutlined,
    HddOutlined,
    DashboardOutlined,
    AppstoreOutlined
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
    const models = computed(() => store.getters['project/ins'].models)
    const isFront = computed<boolean>(() => store.getters['project/ins'].database.length === 0)
    const expanded = reactive<string[]>([])

    onMounted(() => {
      if (route.fullPath.endsWith(`/project/${pid}`) || route.fullPath.includes('/model/')) {
        expanded.push('project')
      }
      if (route.fullPath.includes('/mid/')) {
        expanded.push('middle')
      }
    })

    function onItemSelected({ key }: { key: any }) {
      router.push(`/server-package/${key}`)
    }
    return {
      pid,
      mid,
      sid,
      pjtName,
      mdlName,
      models,
      isFront,
      expanded,
      collapsed: ref<boolean>(false),
      onItemSelected
    }
  }
})
</script>
