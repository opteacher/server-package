<template>
  <a-popover
    v-model:open="visibles.ctrlMenu"
    overlayClassName="popmu-p-0"
    trigger="click"
    placement="bottomRight"
  >
    <template #content>
      <a-menu class="w-48 border-r-0" mode="inline" @click="onProjCtrlClick">
        <a-menu-item key="sync_proj" :disabled="project.status.stat === 'loading'">
          <template #icon><SyncOutlined /></template>
          同步
        </a-menu-item>
        <a-menu-item v-if="project.thread || project.status.stat === 'loading'" key="stop_proj">
          <template #icon><PoweroffOutlined /></template>
          停止
        </a-menu-item>
        <template v-if="project.thread">
          <a-divider class="my-2" />
          <a-menu-item key="send_files" :disabled="project.status.stat === 'loading'">
            <template #icon><UploadOutlined /></template>
            传输文件
          </a-menu-item>
          <FormDialog
            title="投放文件"
            :new-fun="() => newOne(Transfer)"
            v-model:visible="visibles.tsfFiles"
            :mapper="tsMapper"
            :emitter="tsEmitter"
            @submit="onTransfer"
          />
        </template>
      </a-menu>
    </template>
    <a-button>
      <template #icon><ControlOutlined /></template>
      控制项目
    </a-button>
  </a-popover>
  <FormDialog
    title="同步"
    width="30vw"
    :mapper="mapper"
    :new-fun="() => ({})"
    :emitter="emitter"
    @submit="
      () =>
        api
          .sync(project.key)
          .then(() => store.dispatch('project/refresh'))
          .then(() => emit('sync_fin'))
    "
  />
</template>

<script setup lang="ts">
import { pjtAPI as api } from '@/apis'
import Project from '@/types/project'
import Transfer from '@/types/transfer'
import { newOne } from '@/utils'
import { tsEmitter, tsMapper } from '@/views/Project'
import {
  ControlOutlined,
  PoweroffOutlined,
  SyncOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import Mapper from '@lib/types/mapper'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, reactive } from 'vue'
import { useStore } from 'vuex'

const emit = defineEmits(['sync_fin'])
const store = useStore()
const project = computed<Project>(() => store.getters['project/ins'])
const emitter = new Emitter()
const mapper = new Mapper(
  project.value.database
    ? {
        dropDbs: {
          label: '启动时清空数据库',
          type: 'Checkbox'
        }
      }
    : {
        extFiles: {
          label: '上传传送文件',
          type: 'UploadFile',
          path: '/server-package/api/v1/temp/file',
          params: {
            keepName: true
          }
        }
      }
)
const visibles = reactive({
  ctrlMenu: false,
  tsfFiles: false
})

function onProjCtrlClick({ key }: { key: 'sync_proj' | 'stop_proj' | 'send_files' }) {
  const project = store.getters['project/ins']
  switch (key) {
    case 'sync_proj':
      emitter.emit('update:visible', true)
      break
    case 'stop_proj':
      api.stop(project.key)
      break
    case 'send_files':
      visibles.tsfFiles = true
      break
  }
}
async function onTransfer(info: Transfer) {
  await api.transfer(info)
  await store.dispatch('project/refresh')
  visibles.tsfFiles = false
}
</script>
