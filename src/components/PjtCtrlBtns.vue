<template>
  <a-button
    type="primary"
    :disabled="project.status.stat === 'loading'"
    :loading="project.status.stat === 'loading'"
    @click="() => onSyncClick(project.key)"
  >
    <template #icon><SyncOutlined /></template>
    同步
  </a-button>
  <FormDialog
    title="同步前端"
    width="30vw"
    :mapper="mapper"
    :new-fun="() => ({ dir: [] })"
    :emitter="emitter"
    @submit="(form: any) => api.syncFrt(project.key, form)"
  >
    <template #top>
      <info-circle-outlined class="text-lg text-primary" />
      &nbsp;如果选择上传dist文件夹，则不会构建项目，直接把dist内的文件复制到web容器的public目录下
    </template>
  </FormDialog>
  <a-button
    v-if="project.thread || project.status.stat === 'loading'"
    danger
    @click="() => api.stop(project.key)"
  >
    <template #icon><PoweroffOutlined /></template>
    停止
  </a-button>
</template>

<script setup lang="ts">
import { pjtAPI as api } from '@/apis'
import Project from '@/types/project'
import {
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  PoweroffOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'
import Mapper from '@lib/types/mapper'
import { Modal } from 'ant-design-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, createVNode } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const project = computed<Project>(() => store.getters['project/ins'])
const isFront = computed<boolean>(() => store.getters['project/ins'].database.length === 0)
const emitter = new Emitter()
const mapper = new Mapper({
  dir: {
    label: 'dist',
    type: 'UploadFile',
    directory: true,
    params: { keepName: true },
    path: '/server-package/api/v1/temp/file',
    onChange: () => {}
  }
})

function onSyncClick(pid: string) {
  if (isFront.value) {
    emitter.emit('update:show', true)
  } else {
    Modal.confirm({
      title: '确定（重）启动项目？',
      icon: createVNode(ExclamationCircleOutlined),
      onOk: () => api.sync(pid).then(() => setTimeout(() => store.dispatch('project/refresh'), 10))
    })
  }
}
</script>
