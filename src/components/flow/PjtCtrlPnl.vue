<template>
  <div>
    <template v-if="pLoading">
      <LoadingOutlined />
      &nbsp;
      <a-typography-text type="secondary" class="mr-2">操作加载中……</a-typography-text>
    </template>
    <a-popover
      v-model:visible="flwOpnVsb"
      overlayClassName="popmu-p-0"
      trigger="click"
      placement="bottomRight"
    >
      <template #content>
        <a-menu class="w-48 border-r-0" mode="inline" @click="onFlowOpnClick">
          <a-menu-item key="show_codes">{{ showCodes ? '流程设计' : '显示代码' }}</a-menu-item>
          <a-menu-item-group title="项目控制">
            <a-menu-item key="project_sync" :disabled="pLoading">
              <template v-if="pLoading" #icon>
                <LoadingOutlined />
              </template>
              同步
            </a-menu-item>
            <a-menu-item key="project_stop" v-if="project.thread || pLoading">停止</a-menu-item>
          </a-menu-item-group>
          <a-menu-item-group
            v-if="(service.emit === 'interval' || service.emit === 'timeout') && pRunning"
            title="服务控制"
          >
            <a-menu-item key="job_start">启动</a-menu-item>
            <a-menu-item v-if="service.jobId" key="job_stop">停止</a-menu-item>
          </a-menu-item-group>
        </a-menu>
      </template>
      <a-button>
        <template #icon><MoreOutlined /></template>
      </a-button>
    </a-popover>
  </div>
</template>

<script setup lang="ts">
import { ndAPI, pjtAPI } from '@/apis'
import svcAPI from '@/apis/service'
import Project from '@/types/project'
import Service from '@/types/service'
import { ExclamationCircleOutlined, LoadingOutlined, MoreOutlined } from '@ant-design/icons-vue'
import { Modal } from 'ant-design-vue'
import { computed, createVNode, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

const emit = defineEmits(['update:codes'])
const store = useStore()
const route = useRoute()
const pid = route.params.pid as string
const sid = route.params.sid as string
const service = computed<Service>(() => store.getters['node/service'])
const project = computed<Project>(() => store.getters['project/ins'])
const pLoading = computed<boolean>(() => store.getters['project/ins'].status.stat === 'loading')
const pRunning = computed<boolean>(() => store.getters['project/ins'].status.stat === 'running')
const flwOpnVsb = ref(false)
const showCodes = ref(false)

async function onFlowOpnClick({
  key
}: {
  key: 'show_codes' | 'project_sync' | 'project_stop' | 'job_start' | 'job_stop'
}) {
  flwOpnVsb.value = false
  switch (key) {
    case 'show_codes':
      await onShowCodesClick()
      break
    case 'project_sync':
      Modal.confirm({
        title: '确定（重）启动项目？',
        icon: createVNode(ExclamationCircleOutlined),
        onOk: () =>
          pjtAPI.sync(pid).then(() => setTimeout(() => store.dispatch('project/refresh'), 10))
      })
      break
    case 'project_stop':
      pjtAPI.stop(pid)
      break
    case 'job_start':
      await svcAPI.job.restart(sid)
      break
    case 'job_stop':
      await svcAPI.job.stop(sid)
      break
  }
}
async function onShowCodesClick() {
  showCodes.value = !showCodes.value
  emit(
    'update:codes',
    showCodes.value
      ? store.getters['node/subNdKey']
        ? await ndAPI.subNode.codes(store.getters['node/subNdKey'])
        : await svcAPI.flow.codes(sid)
      : ''
  )
}
</script>
