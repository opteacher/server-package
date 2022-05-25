<template>
  <a-layout class="h-100">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo" />
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="onItemSelected">
        <a-menu-item :key="`project/${pid}/ds/login`">
          <login-outlined />
          <span>登录页</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/ds/navigate`">
          <hdd-outlined />
          <span>导航栏</span>
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
      <a-layout>
        <a-space style="margin: 16px 24px">
          <a-button @click="$router.go(-1)">
            <template #icon><arrow-left-outlined /></template>
          </a-button>
          <a-breadcrumb>
            <a-breadcrumb-item><a href="/server-package">项目</a></a-breadcrumb-item>
            <a-breadcrumb-item>
              <a :href="`/server-package/project/${pid}`">
                {{ pjtName }}
              </a>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="active.endsWith('login')">登录页</a-breadcrumb-item>
            <a-breadcrumb-item v-else-if="active.endsWith('navigate')">导航栏</a-breadcrumb-item>
          </a-breadcrumb>
        </a-space>
        <a-layout-content
          :style="{
            margin: '0 24px 16px 24px',
            padding: '24px',
            background: '#fff',
            minHeight: '280px',
            overflowY: 'auto'
          }"
        >
          <a-space class="mb-16">
            <a-button type="primary" @click="showPub = true">
              <template #icon><cloud-upload-outlined /></template>
              发布中台
            </a-button>
            <FormDialog
              title="配置中台"
              :copy="Publish.copy"
              :show="showPub"
              :mapper="pubMapper"
              :emitter="pubEmitter"
              @update:show="
                show => {
                  showPub = show
                }
              "
              @submit="onPublish"
            />
          </a-space>
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  LoginOutlined,
  HddOutlined,
  ArrowLeftOutlined,
  CloudUploadOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined
} from '@ant-design/icons-vue'
import Mapper from '@/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import FormDialog from '../components/com/FormDialog.vue'
import Publish from '@/types/publish'
import { pjtAPI as api } from '../apis'

export default defineComponent({
  name: 'MiddleLayout',
  components: {
    LoginOutlined,
    HddOutlined,
    ArrowLeftOutlined,
    CloudUploadOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,

    FormDialog
  },
  props: {
    active: { type: String, required: true }
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const pid = route.params.pid
    const pjtName = computed(() => store.getters['project/ins'].name)
    const showPub = ref(false)
    const pubEmitter = new Emitter()
    const pubMapper = new Mapper({
      title: {
        label: '标题',
        desc: '登录页和首页的标题',
        type: 'Input'
      },
      lclDep: {
        label: '本地部署',
        desc: '是否部署到项目实例，相当于前后端分离',
        type: 'Checkbox'
      }
    })

    function onItemSelected({ key }: { key: any }) {
      router.push(`/server-package/${key}`)
    }
    return {
      Publish,

      pid,
      pjtName,
      collapsed: ref<boolean>(false),
      showPub,
      pubEmitter,
      pubMapper,

      onItemSelected,
      onPublish: (info: Publish) => api.publish(info)
    }
  }
})
</script>
