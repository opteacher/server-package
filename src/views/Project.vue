<template>
  <LytProject :active="`project/${pid}`">
    <a-row class="mb-5">
      <a-col :span="12">
        <a-space>
          <p style="font-size: 15pt; font-weight: bold; margin-bottom: 0">
            <project-outlined />
            &nbsp;{{ project.name }}
          </p>
          <a-tag v-if="project.status === 'running'" color="#52c41a">{{ project.status }}</a-tag>
          <a-tag v-else-if="project.status === 'stopped'" color="#f5222d">
            {{ project.status }}
          </a-tag>
          <a-tag v-else-if="project.status === 'loading'" color="#faad14">
            {{ project.status }}
          </a-tag>
        </a-space>
      </a-col>
      <a-col :span="12" style="text-align: right">
        <a-space>
          <a-button @click="showProj = true">
            <template #icon><SettingOutlined /></template>
            &nbsp;配置
          </a-button>
          <FormDialog
            title="配置项目"
            :copy="Project.copy"
            :show="showProj"
            :mapper="projMapper"
            :object="project"
            @update:show="
              show => {
                showProj = show
              }
            "
            @submit="onConfig"
          />
          <a-button
            type="primary"
            :disabled="project.status === 'loading'"
            :loading="project.status === 'loading'"
            @click="onSync"
          >
            <template #icon><SyncOutlined /></template>
            &nbsp;同步
          </a-button>
          <a-tooltip>
            <template #title>传输本地文件到项目实例中</template>
            <a-button
              v-if="project.thread"
              class="ml-5"
              :disabled="project.status === 'loading'"
              :loading="project.status === 'loading'"
              @click="showTsfm = true"
            >
              <template #icon><UploadOutlined /></template>
              &nbsp;传输文件
            </a-button>
          </a-tooltip>
          <FormDialog
            title="投放文件"
            :copy="Transfer.copy"
            :show="showTsfm"
            :mapper="tsMapper"
            :emitter="tsEmitter"
            @update:show="
              show => {
                showTsfm = show
              }
            "
            @submit="onTransfer"
          />
          <a-button v-if="project.thread" class="ml-5" danger @click="onStop">
            <template #icon><PoweroffOutlined /></template>
            &nbsp;停止
          </a-button>
        </a-space>
      </a-col>
    </a-row>
    <p class="mb-16">
      <info-circle-outlined />
      &nbsp;{{ project.desc }}
    </p>
    <a-row>
      <a-col :span="12">
        <a-descriptions size="small">
          <a-descriptions-item label="占用端口">{{ project.port }}</a-descriptions-item>
          <a-descriptions-item label="数据库">
            {{ project.database[0] }}/{{ project.database[1] }}
          </a-descriptions-item>
          <a-descriptions-item label="启动时清空数据库">
            {{ project.dropDbs ? '是' : '否' }}
          </a-descriptions-item>
          <a-descriptions-item v-if="project.commands" label="前置命令">
            {{ project.commands }}
          </a-descriptions-item>
        </a-descriptions>
      </a-col>
    </a-row>
    <div class="mt-24">
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
          <a :href="`/server-package/project/${pid}/model/${model.key}`">{{ model.name }}</a>
        </template>
      </EditableTable>
    </div>
  </LytProject>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, ref, createVNode, reactive, onMounted } from 'vue'
import { Modal } from 'ant-design-vue'
import {
  SettingOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  UploadOutlined,
  PoweroffOutlined,
  ProjectOutlined
} from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import LytProject from '../layouts/LytProject.vue'
import FormDialog from '../components/com/FormDialog.vue'
import EditableTable from '../components/com/EditableTable.vue'
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
    FormDialog,
    EditableTable,
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
    async function onSync() {
      Modal.confirm({
        title: '确定同步项目到服务器？',
        icon: createVNode(ExclamationCircleOutlined),
        content: createVNode(
          'div',
          {
            style: 'color:red;'
          },
          '同步过程中，该项目已有的服务将暂时停用！'
        ),
        onOk: () => api.sync(pid)
      })
    }
    async function onStop() {
      Modal.confirm({
        title: '是否停止项目？',
        icon: createVNode(ExclamationCircleOutlined),
        content: '项目实例所提供的服务也将同时停止！',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: () => api.stop(pid)
      })
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
      store,
      router,
      projMapper,
      project,
      showProj,
      showTsfm,
      tsMapper,
      tsEmitter,

      refresh,
      onSync,
      onStop,
      onConfig: (pjt: Project) => api.update(pjt),
      onTransfer: (info: Transfer) => api.transfer(info)
    }
  }
})
</script>

<style lang="less" scoped>
.editable-cell {
  position: relative;
  .editable-cell-input-wrapper,
  .editable-cell-text-wrapper {
    padding-right: 48px;
  }

  .editable-cell-text-wrapper {
    padding: 5px 48px 5px 5px;
  }

  .editable-cell-icon {
    position: absolute;
    width: 20px;
    cursor: pointer;
    line-height: 28px;
  }

  .editable-cell-icon {
    display: none;
  }

  .editable-cell-icon:hover {
    color: #108ee9;
  }

  .editable-add-btn {
    margin-bottom: 8px;
  }
}
.editable-cell:hover .editable-cell-icon {
  display: inline-block;
}
</style>
