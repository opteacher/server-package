<template>
  <a-layout class="h-full">
    <a-layout-sider
      class="relative"
      width="300"
      v-model:collapsed="collapsed"
      :trigger="null"
      collapsible
    >
      <div class="h-8 m-4 bg-gray-700" />
      <a-menu
        class="absolute top-12 left-0 bottom-0 right-0 overflow-y-auto"
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
          <a-button @click="$router.push('/')">
            <template #icon><home-outlined /></template>
          </a-button>
          <a-breadcrumb>
            <a-breadcrumb-item><a href="/">项目</a></a-breadcrumb-item>
            <a-breadcrumb-item>
              <a
                v-if="active.includes('/model/') || active.endsWith('auth')"
                :href="`/project/${pid}`"
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
          <a-row v-if="active.includes('/mid/')" class="mb-2">
            <a-col :span="12">
              <a-tooltip>
                <template #title>
                  在线编译可能导致服务器内存溢出，建议离线编译打包后在上传发布
                </template>
                <a-button type="primary" :loading="middle.loading" @click="onMidPubShow(true)">
                  <template #icon><cloud-upload-outlined /></template>
                  发布中台
                </a-button>
              </a-tooltip>
              <FormDialog
                title="配置中台"
                :copy="Middle.copy"
                v-model:show="midVsb"
                :mapper="midMapper"
                :emitter="midEmitter"
                @submit="onMidPub"
              >
                <template #footer="pubInfo">
                  <a-space>
                    <a-button @click="onMidGen(pubInfo)">导出</a-button>
                    <a-upload
                      name="file"
                      :multiple="false"
                      :directory="true"
                      :showUploadList="false"
                      action="/server-package/api/v1/temp/file"
                      @change="(info: any) => onMidDep(info, pubInfo)"
                    >
                      <a-tooltip>
                        <template #title>选择build生成的dist文件夹</template>
                        <a-button>导入</a-button>
                      </a-tooltip>
                    </a-upload>
                    <a-divider type="vertical" />
                    <a-tooltip>
                      <template #title>
                        在线编译可能导致服务器内存溢出，建议导出后编译后再上传
                      </template>
                      <a-button type="primary" @click="onMidPub(pubInfo)">确定</a-button>
                    </a-tooltip>
                  </a-space>
                </template>
              </FormDialog>
            </a-col>
            <a-col :span="12" class="text-right">
              <a-button
                :disabled="middle.loading || !middle.url"
                :href="middle.url"
                target="_blank"
              >
                <template #icon><eye-outlined /></template>
                浏览中台
              </a-button>
            </a-col>
          </a-row>
          <slot />
        </a-layout-content>
      </a-layout>
    </a-layout>
  </a-layout>
</template>

<script lang="ts" setup name="MainLayout">
import Mapper from '@/lib/frontend-library/src/types/mapper'
import Middle from '@/types/middle'
import {
  AppstoreOutlined,
  AuditOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  EyeOutlined,
  HddOutlined,
  HomeOutlined,
  LayoutOutlined,
  LoginOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProjectOutlined,
  UserOutlined
} from '@ant-design/icons-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, defineProps, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import { pjtAPI as api } from '../apis'

defineProps({
  active: { type: String, required: true }
})
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
const midVsb = ref(false)
const midEmitter = new Emitter()
const midMapper = new Mapper({
  title: {
    label: '标题',
    desc: '登录页和首页的标题',
    type: 'Input'
  },
  prefix: {
    label: '路由前缀',
    desc: '/项目名/中台前缀/(home|login)',
    type: 'Input'
  },
  lclDep: {
    label: '本地部署',
    desc: '是否部署到项目实例，【非本地部署】相当于前后端分离',
    type: 'Checkbox'
  }
})
const middle = computed(() => store.getters['project/middle'])
const collapsed = ref<boolean>(false)

onMounted(() => {
  if (route.fullPath.endsWith(`/project/${pid}`) || route.fullPath.includes('/model/')) {
    expanded.push('project')
  }
  if (route.fullPath.includes('/mid/')) {
    expanded.push('middle')
  }
})

function onItemSelected({ key }: { key: any }) {
  router.push(key)
}
function onMidPubShow(show: boolean) {
  if (show) {
    midEmitter.emit('update:data', store.getters['project/middle'])
  }
  midVsb.value = show
}
async function onMidPub(info: Middle) {
  await api.middle.publish(pid, info)
  store.dispatch('project/chkMidStatus')
  midVsb.value = false
}
async function onMidGen(info: Middle) {
  await api.middle.generate(pid)
  midVsb.value = false
}
async function onMidDep(info: any, pubInfo: Middle) {
  if (
    info.file.status === 'done' &&
    info.fileList
      .map((file: any) => file.status)
      .reduce((prev: any, curr: any) => prev && curr === 'done')
  ) {
    await api.middle.deploy(pid, {
      fileList: info.fileList.map((file: any) => ({
        name: file.name,
        src: file.response.result,
        dest: file.originFileObj.webkitRelativePath || file.name
      }))
    })
    midVsb.value = false
  }
}
</script>
