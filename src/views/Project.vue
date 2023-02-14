<template>
  <LytProject :active="`project/${pid}`">
    <div class="mb-1.5 flex justify-between">
      <a-space>
        <p class="mb-0 text-lg font-bold">
          <project-outlined />
          &nbsp;{{ project.name }}
        </p>
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
      </a-space>
      <a-space>
        <a-button @click="showProj = true">
          <template #icon><SettingOutlined /></template>
          &nbsp;配置
        </a-button>
        <FormDialog
          title="配置项目"
          :copy="Project.copy"
          v-model:show="showProj"
          :mapper="projMapper"
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
            @click="showTsfm = true"
          >
            <template #icon><UploadOutlined /></template>
            &nbsp;传输文件
          </a-button>
        </a-tooltip>
        <FormDialog
          title="投放文件"
          :copy="Transfer.copy"
          v-model:show="showTsfm"
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
      </a-space>
    </div>
    <p class="mb-4">
      <info-circle-outlined />
      &nbsp;{{ project.desc }}
    </p>
    <a-descriptions size="small" :column="4">
      <a-descriptions-item label="占用端口">{{ project.port }}</a-descriptions-item>
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
    </a-descriptions>
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
        <a :href="`/server-package/project/${pid}/model/${model.key}`" @click.stop="">
          {{ model.name }}
        </a>
      </template>
    </EditableTable>
  </LytProject>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, ref } from 'vue'
import {
  SettingOutlined,
  InfoCircleOutlined,
  SyncOutlined,
  UploadOutlined,
  PoweroffOutlined,
  ProjectOutlined
} from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import LytProject from '../layouts/LytProject.vue'
import { tsMapper, tsEmitter } from './Project'
import { columns as mdlColumns, mapper as mdlMapper } from './Model'
import { mapper as projMapper } from './Home'
import { useStore } from 'vuex'
import Project from '@/types/project'
import Model from '@/types/model'
import Transfer from '@/types/transfer'
import ExpCls from '@/types/expCls'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { pjtAPI as api, mdlAPI } from '../apis'

export default defineComponent({
  name: 'Project',
  components: {
    LytProject,
    SettingOutlined,
    InfoCircleOutlined,
    SyncOutlined,
    UploadOutlined,
    PoweroffOutlined,
    ProjectOutlined
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const pid = route.params.pid as string
    const project = computed(() => store.getters['project/ins'] as Project)
    const showProj = ref(false)
    const showTsfm = ref(false)
    const mdlEmitter = new Emitter()

    async function refresh() {
      await store.dispatch('project/refresh')
      mdlEmitter.emit('refresh', project.value.models)
    }
    async function onConfig(pjt: Project) {
      await api.update(pjt)
      await store.dispatch('project/refresh')
      showProj.value = false
    }
    async function onTransfer(info: Transfer) {
      await api.transfer(info)
      await store.dispatch('project/refresh')
      showTsfm.value = false
    }
    return {
      Project,
      Transfer,
      Model,
      ExpCls,

      mdlAPI,
      mdlEmitter,
      mdlColumns,
      mdlMapper,
      pid,
      api,
      store,
      router,
      projMapper,
      project,
      showProj,
      showTsfm,
      tsMapper,
      tsEmitter,

      refresh,
      onConfig,
      onTransfer
    }
  }
})
</script>
