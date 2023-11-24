<template>
  <LytMain active="home">
    <EditableTable
      title="项目"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :new-fun="() => newOne(Project)"
      :emitter="emitter"
      sclHeight="h-full"
    >
      <template #name="{ record: project }">
        <a :href="`/server-package/project/${project.key}`" @click.stop>
          {{ project.name }}
        </a>
      </template>
      <template #database="{ record: project }">
        <template v-if="project.database">
          <a-tooltip v-if="project.dropDbs">
            <template #title>启动时清空</template>
            <clear-outlined />
          </a-tooltip>
          &nbsp;
          {{ project.database.dbtype }}db://{{ project.database.host }}:{{
            project.database.port
          }}/{{ project.database.db }}
        </template>
        <template v-else>
          <a-tooltip>
            <template #title>前端项目</template>
            <html5-outlined />
          </a-tooltip>
          &nbsp;前端
        </template>
      </template>
      <template #independ="{ record: project }">
        {{ project.independ ? '是' : '否' }}
      </template>
      <template #status="{ record: project }">
        <template v-if="project.thread === 0">
          <a-badge status="error" />
          <span class="text-error">停止</span>
        </template>
        <template v-else-if="project.status.stat === 'loading'">
          <loading-outlined />
          <span class="text-warning">加载中</span>
        </template>
        <template v-else>
          <a-badge status="success" />
          <span class="text-success">运行中</span>
        </template>
      </template>
      <template #operation="{ record: project }">
        <a-button
          type="primary"
          size="small"
          :disabled="project.status.stat === 'loading'"
          :loading="project.status.stat === 'loading'"
          @click.stop="api.sync(project.key)"
        >
          <template #icon><SyncOutlined /></template>
          &nbsp;同步
        </a-button>
        <a-button
          v-if="project.thread || project.status.stat === 'loading'"
          class="ml-1"
          size="small"
          danger
          @click.stop="api.stop(project.key)"
        >
          <template #icon><PoweroffOutlined /></template>
          &nbsp;停止
        </a-button>
      </template>
    </EditableTable>
  </LytMain>
</template>

<script lang="ts" setup name="Home">
import Project from '@/types/project'
import { newOne } from '@/utils'
import {
  ClearOutlined,
  Html5Outlined,
  LoadingOutlined,
  PoweroffOutlined,
  SyncOutlined
} from '@ant-design/icons-vue'
import { watch } from 'vue'
import { useStore } from 'vuex'

import { pjtAPI as api } from '../apis'
import LytMain from '../layouts/LytMain.vue'
import { columns, emitter, mapper } from './Home'

const store = useStore()

watch(
  () => store.getters['project/ins'].status.stat,
  () => {
    emitter.emit('refresh')
  }
)
</script>
