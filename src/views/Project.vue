<template>
  <LytProject :active="`project/${pid}`">
    <a-page-header class="p-0 mb-10" :title="project.name" :sub-title="project.desc">
      <template #tags>
        <a-tooltip>
          <template #title>点击刷新状态</template>
          <a-tag v-if="project.status.stat === 'running'" color="#52c41a">
            <a @click="refresh">{{ project.status.stat }}</a>
          </a-tag>
          <a-tag v-else-if="project.status.stat === 'stopped'" color="#f5222d">
            <a @click="refresh">{{ project.status.stat }}</a>
          </a-tag>
          <a-tag v-else-if="project.status.stat === 'loading'" color="#faad14">
            <a @click="refresh">{{ project.status.stat }}</a>
          </a-tag>
        </a-tooltip>
      </template>
      <template #extra>
        <a-button @click="cfgVsb = true">
          <template #icon><SettingOutlined /></template>
          &nbsp;配置
        </a-button>
        <FormDialog
          title="配置项目"
          :copy="Project.copy"
          v-model:show="cfgVsb"
          :mapper="pjtMapper"
          :object="project"
          @submit="onConfig"
        />
        <a-button
          type="primary"
          :disabled="project.status.stat === 'loading'"
          :loading="project.status.stat === 'loading'"
          @click="api.sync(pid)"
        >
          <template #icon><SyncOutlined /></template>
          &nbsp;同步
        </a-button>
        <a-tooltip v-if="project.thread">
          <template #title>传输本地文件到项目实例中</template>
          <a-button
            :disabled="project.status.stat === 'loading'"
            :loading="project.status.stat === 'loading'"
            @click="tsfVsb = true"
          >
            <template #icon><UploadOutlined /></template>
            &nbsp;传输文件
          </a-button>
        </a-tooltip>
        <FormDialog
          title="投放文件"
          :copy="Transfer.copy"
          v-model:show="tsfVsb"
          :mapper="tsMapper"
          :emitter="tsEmitter"
          @submit="onTransfer"
        />
        <a-button
          v-if="project.thread || project.status.stat === 'loading'"
          danger
          @click="api.stop(pid)"
        >
          <template #icon><PoweroffOutlined /></template>
          &nbsp;停止
        </a-button>
      </template>
      <a-descriptions size="small" :column="4">
        <a-descriptions-item label="占用端口">{{ project.port }}</a-descriptions-item>
        <template v-if="!isFront">
          <a-descriptions-item label="数据库">
            {{ project.database[0] }}/{{ project.database[1] }}
          </a-descriptions-item>
          <a-descriptions-item label="启动时清空数据库">
            {{ project.dropDbs ? '是' : '否' }}
          </a-descriptions-item>
          <a-descriptions-item label="独立部署（不依赖server-package）">
            {{ project.independ ? '是' : '否' }}
          </a-descriptions-item>
          <a-descriptions-item v-if="project.commands" label="前置命令" :span="4">
            <a-typography-paragraph
              class="whitespace-pre-line"
              :ellipsis="{ rows: 2, expandable: true, symbol: 'more' }"
              :content="project.commands"
            />
          </a-descriptions-item>
        </template>
      </a-descriptions>
    </a-page-header>
    <EditableTable
      title="模型"
      size="small"
      :api="mdlAPI"
      :columns="mdlColumns"
      :mapper="mdlMapper"
      :copy="Model.copy"
      :emitter="mdlEmitter"
      @save="refresh"
      @delete="refresh"
    >
      <template #name="{ record: model }">
        <a :href="`/server-package/project/${pid}/model/${model.key}`" @click.stop>
          {{ model.name }}
        </a>
      </template>
    </EditableTable>
    <SvcTable class="mt-10" :mapper="svcMapper" :columns="svcColumns" :emitter="svcEmitter" />
  </LytProject>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import SvcTable from '@/components/SvcTable.vue'
import ExpCls from '@/types/expCls'
import { Export } from '@/types/frontend'
import Model from '@/types/model'
import Project from '@/types/project'
import Service from '@/types/service'
import Transfer from '@/types/transfer'
import {
  PoweroffOutlined,
  SettingOutlined,
  SyncOutlined,
  UploadOutlined
} from '@ant-design/icons-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { computed, defineComponent, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'

import { pjtAPI as api, mdlAPI, svcAPI } from '../apis'
import LytProject from '../layouts/LytProject.vue'
import { mapper as pjtMapper } from './Home'
import { columns as mdlColumns, mapper as mdlMapper } from './Model'
import { frontend, svcColumns, svcEmitter, svcMapper, tsEmitter, tsMapper } from './Project'

export default defineComponent({
  name: 'Project',
  components: {
    LytProject,
    SvcTable,
    SettingOutlined,
    SyncOutlined,
    UploadOutlined,
    PoweroffOutlined
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const pid = route.params.pid as string
    const project = computed<Project>(() => store.getters['project/ins'] as Project)
    const isFront = computed<boolean>(() => store.getters['project/ins'].database.length === 0)
    const cfgVsb = ref(false)
    const tsfVsb = ref(false)
    const mdlEmitter = new Emitter()

    async function refresh() {
      await store.dispatch('project/refresh')
      mdlEmitter.emit('refresh', project.value.models)
      svcEmitter.emit('refresh', project.value.services)
    }
    async function onConfig(pjt: Project) {
      await api.update(pjt)
      await store.dispatch('project/refresh')
      cfgVsb.value = false
    }
    async function onTransfer(info: Transfer) {
      await api.transfer(info)
      await store.dispatch('project/refresh')
      tsfVsb.value = false
    }
    function onFrtMuClick({ key }: { key: 'export' | 'deploy' }) {
      frontend[`${key.slice(0, 3)}Emitter` as 'expEmitter' | 'depEmitter'].emit('update:show', true)
    }
    return {
      Project,
      Transfer,
      Model,
      Service,
      ExpCls,
      Export,

      mdlAPI,
      mdlEmitter,
      mdlColumns,
      mdlMapper,
      svcAPI,
      svcEmitter,
      svcMapper,
      svcColumns,
      frontend,
      pid,
      api,
      store,
      router,
      isFront,
      pjtMapper,
      project,
      cfgVsb,
      tsfVsb,
      tsMapper,
      tsEmitter,

      refresh,
      onConfig,
      onTransfer,
      onFrtMuClick
    }
  }
})
</script>
