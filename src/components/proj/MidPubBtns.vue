<template>
  <a-popover
    v-model:visible="visibles.midMenu"
    overlayClassName="popmu-p-0"
    trigger="click"
    placement="bottomLeft"
  >
    <template #content>
      <a-menu class="w-48 border-r-0" mode="inline" @click="onMidPubClick">
        <a-menu-item key="publish">
          <template #icon><CloudUploadOutlined /></template>
          发布
        </a-menu-item>
        <a-menu-item key="review" v-if="middle.url">
          <template #icon><EyeOutlined /></template>
          浏览
        </a-menu-item>
        <a-divider class="my-0" />
        <a-menu-item key="export">
          <template #icon><ExportOutlined /></template>
          导出
        </a-menu-item>
        <a-upload
          class="imp-mid"
          name="file"
          :multiple="false"
          :directory="true"
          :showUploadList="false"
          action="/server-package/api/v1/temp/file"
          @change="onMidDep"
        >
          <a-tooltip>
            <template #title>选择build生成的dist文件夹</template>
            <a-menu-item key="import">
              <template #icon><ImportOutlined /></template>
              导入
            </a-menu-item>
          </a-tooltip>
        </a-upload>
      </a-menu>
    </template>
    <a-button :loading="loading">
      <template #icon><InsertRowLeftOutlined /></template>
      发布中台
    </a-button>
  </a-popover>
  <FormDialog
    title="配置中台"
    width="40vw"
    :new-fun="() => newOne(Middle)"
    :mapper="mapper"
    :emitter="emitter"
    @submit="onMidSubmit"
  />
</template>

<script setup lang="ts">
import { pjtAPI as api } from '@/apis'
import Middle from '@/types/middle'
import { newOne } from '@/utils'
import {
  CloudUploadOutlined,
  ExportOutlined,
  ImportOutlined,
  InsertRowLeftOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'
import Mapper from '@lib/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

type OperType = 'publish' | 'export' | 'import' | 'review'

const visibles = reactive({
  midMenu: false
})
const route = useRoute()
const store = useStore()
const pid = route.params.pid as string
const loading = ref(false)
const emitter = new Emitter()
const mapper = new Mapper({
  title: {
    label: '标题',
    placeholder: '登录页和首页的标题',
    type: 'Input'
  },
  prefix: {
    label: '路由前缀',
    placeholder: '/项目名/中台前缀/(home|login)',
    type: 'Input'
  },
  lclDep: {
    label: '本地部署',
    placeholder: '是否部署到项目实例，【非本地部署】相当于前后端分离',
    type: 'Checkbox'
  }
})
const genOrPub = ref<OperType>('export')
const middle = computed(() => store.getters['project/middle'])

function onMidPubClick({ key }: { key: OperType }) {
  if (key === 'export' || key === 'publish') {
    genOrPub.value = key
    emitter.emit('update:data', store.getters['project/middle'])
    emitter.emit('update:visible', true)
  }
}
async function onMidSubmit(info: Middle) {
  switch (genOrPub.value) {
    case 'export':
      onMidGen(info)
      break
    case 'publish':
      onMidPub(info)
      break
    case 'review':
      window.open(store.getters['project/middle'].url, '_blank')
      break
  }
}
async function onMidPub(info: Middle) {
  await api.middle.publish(pid, info)
  store.dispatch('project/chkMidStatus')
  emitter.emit('update:visible', false)
}
async function onMidGen(_info: Middle) {
  await api.middle.generate(pid)
  emitter.emit('update:visible', false)
}
async function onMidDep(info: any) {
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
    emitter.emit('update:visible', false)
  }
}
</script>

<style>
.imp-mid {
  @apply w-full;
}
.imp-mid .ant-upload {
  @apply w-full;
}
</style>