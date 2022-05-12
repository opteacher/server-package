<template>
  <a-layout class="h-100">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo" />
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="onItemSelected">
        <a-menu-item :key="`project/${pid}/model/${mid}/apis`">
          <api-outlined />
          <span>接口</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/model/${mid}/jobs`">
          <field-time-outlined />
          <span>任务</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/model/${mid}/flow/${sid}`" disabled>
          <edit-outlined />
          <span>流程</span>
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
              <a
                v-if="active.includes('/model/') || active.endsWith('auth')"
                :href="`/server-package/project/${pid}`"
              >
                {{ pjtName }}
              </a>
              <span v-else>{{ pjtName }}</span>
            </a-breadcrumb-item>
            <a-breadcrumb-item>
              <a :href="`/server-package/project/${pid}`">模型</a>
            </a-breadcrumb-item>
            <a-breadcrumb-item>
              <a :href="`/server-package/project/${pid}/model/${mid}`">{{ mdlName }}</a>
            </a-breadcrumb-item>
            <a-breadcrumb-item v-if="active.slice(-4) === 'apis'">接口</a-breadcrumb-item>
            <a-breadcrumb-item v-else-if="active.slice(-4) === 'jobs'">任务</a-breadcrumb-item>
            <template v-if="active.includes('/flow/')">
              <a-breadcrumb-item>
                <a :href="`/server-package/project/${pid}/model/${mid}/apis`">服务</a>
              </a-breadcrumb-item>
              <a-breadcrumb-item>设计流程</a-breadcrumb-item>
            </template>
          </a-breadcrumb>
        </a-space>
        <a-layout-content
          :style="{
            margin: '0 24px 16px 24px',
            padding: '24px',
            background: '#fff',
            minHeight: '280px'
          }"
        >
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
import { computed, defineComponent, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter, useRoute } from 'vue-router'
import {
  ApiOutlined,
  FieldTimeOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  EditOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons-vue'

export default defineComponent({
  name: 'ServiceLayout',
  components: {
    ApiOutlined,
    FieldTimeOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    EditOutlined,
    ArrowLeftOutlined
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
