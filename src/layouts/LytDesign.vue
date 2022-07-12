<template>
  <a-layout
    class="h-100"
    @dragover.stop="(e: any) => e.preventDefault()"
    @drop.stop="onFieldDropDown"
  >
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo" />
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="onItemSelected">
        <a-menu-item :key="`project/${pid}/model/${mid}/form`">
          <form-outlined />
          <span>表单</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/model/${mid}/table`">
          <table-outlined />
          <span>表项</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/model/${mid}/demo`">
          <desktop-outlined />
          <span>演示</span>
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
            <a-breadcrumb-item><a href="/server-package/">项目</a></a-breadcrumb-item>
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
            <a-breadcrumb-item v-if="active.slice(-4) === 'form'">表单</a-breadcrumb-item>
            <a-breadcrumb-item v-else-if="active.slice(-5) === 'table'">表项</a-breadcrumb-item>
            <a-breadcrumb-item v-else-if="active.slice(-4) === 'demo'">中台演示</a-breadcrumb-item>
          </a-breadcrumb>
        </a-space>
        <a-layout-content
          :style="{
            margin: '0 24px 16px 24px',
            padding: '24px',
            background: '#fff',
            minHeight: '280px',
            overflowY: 'hidden'
          }"
        >
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  FormOutlined,
  TableOutlined,
  ArrowLeftOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DesktopOutlined
} from '@ant-design/icons-vue'
import { onFieldDropDown } from '../views/Form'

export default defineComponent({
  name: 'DesignLayout',
  components: {
    FormOutlined,
    TableOutlined,
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    ArrowLeftOutlined,
    DesktopOutlined
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
    const pjtName = computed(() => store.getters['project/ins'].name)
    const mdlName = computed(() => store.getters['model/ins'].name)

    function onItemSelected({ key }: { key: any }) {
      router.push(`/server-package/${key}`)
    }
    return {
      pid,
      mid,
      pjtName,
      mdlName,
      collapsed: ref<boolean>(false),
      onItemSelected,
      onFieldDropDown
    }
  }
})
</script>
