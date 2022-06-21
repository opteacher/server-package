<template>
  <a-layout class="h-100">
    <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible>
      <div class="logo" />
      <a-menu :selectedKeys="[active]" theme="dark" mode="inline" @select="onItemSelected">
        <a-menu-item :key="`project/${pid}/mid/login`">
          <login-outlined />
          <span>登录页</span>
        </a-menu-item>
        <a-menu-item :key="`project/${pid}/mid/navigate`">
          <hdd-outlined />
          <span>导航栏</span>
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
                <a-button class="w-100" type="primary" danger>退出登录</a-button>
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
          <a-row class="mb-16">
            <a-col :span="12">
              <a-button type="primary" :loading="middle.loading" @click="onPubDlgShow(true)">
                <template #icon><cloud-upload-outlined /></template>
                发布中台
              </a-button>
              <FormDialog
                title="配置中台"
                :copy="Middle.copy"
                :show="showPub"
                :mapper="pubMapper"
                :emitter="pubEmitter"
                @update:show="onPubDlgShow"
                @submit="onPublish"
              >
                <template #footer="pubInfo">
                  <template v-if="publish">
                    <a-button type="default" @click="onPubDlgShow(false)">取消</a-button>
                    <a-button type="primary" @click="onPublish(pubInfo)">确定</a-button>
                  </template>
                  <template v-else>
                    <a-button type="default" @click="onPubDlgShow(false)">取消</a-button>
                    <a-button type="primary" @click="onGenMid(pubInfo)">导出</a-button>
                    <a-divider type="vertical" />
                    <a-upload
                      name="file"
                      :multiple="false"
                      :directory="true"
                      :showUploadList="false"
                      action="/server-package/api/v1/temp/file"
                      @change="(info: any) => onDepMid(info, pubInfo)"
                    >
                      <a-tooltip>
                        <template #title>选择build生成的dist文件夹</template>
                        <a-button type="primary">导入</a-button>
                      </a-tooltip>
                    </a-upload>
                  </template>
                </template>
              </FormDialog>
              <a-tooltip>
                <template #title>
                  在线编译可能导致服务器内存溢出，建议离线编译打包后在上传发布
                </template>
                <a-button
                  class="ml-10"
                  :loading="middle.loading"
                  @click="onPubDlgShow(true, false)"
                >
                  <template #icon><build-outlined /></template>
                  离线编译
                </a-button>
              </a-tooltip>
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

<script lang="ts">
import { computed, defineComponent, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import {
  LoginOutlined,
  HddOutlined,
  ArrowLeftOutlined,
  CloudUploadOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  EyeOutlined,
  BuildOutlined
} from '@ant-design/icons-vue'
import Mapper from '@/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import FormDialog from '../components/com/FormDialog.vue'
import Middle from '@/types/middle'
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
    EyeOutlined,
    BuildOutlined,

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
    const publish = ref(true)
    const pubEmitter = new Emitter()
    const pubMapper = new Mapper({
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

    onMounted(() => store.dispatch('project/chkMidStatus'))

    function onItemSelected({ key }: { key: any }) {
      router.push(`/server-package/${key}`)
    }
    function onPubDlgShow(show: boolean, pub = true) {
      if (show) {
        pubEmitter.emit('update:data', store.getters['project/middle'])
      }
      publish.value = pub
      showPub.value = show
    }
    async function onPublish(info: Middle) {
      await api.middle.publish(pid, info)
      store.dispatch('project/chkMidStatus')
      showPub.value = false
    }
    async function onGenMid(info: Middle) {
      await api.middle.generate(pid)
      showPub.value = false
    }
    async function onDepMid(info: any, pubInfo: Middle) {
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
        showPub.value = false
      }
    }
    return {
      Middle,

      pid,
      pjtName,
      collapsed: ref<boolean>(false),
      showPub,
      publish,
      pubEmitter,
      pubMapper,
      middle,

      onItemSelected,
      onPublish,
      onPubDlgShow,
      onGenMid,
      onDepMid
    }
  }
})
</script>

<style lang="less">
.avatar-float {
  border: 2px solid white;
}
.avatar-float:hover {
  cursor: pointer;
  border: 2px solid #1890ff;
}
</style>
