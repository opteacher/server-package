<template>
  <LytMain active="home">
    <EditableTable
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Project.copy"
      :emitter="emitter"
      title="项目"
      @add="onEditStart"
    >
      <template #name="{ record: project }">
        <a :href="`/server-package/project/${project.key}`">{{ project.name }}</a>
      </template>
      <template #database="{ record: project }">
        {{ project.database[0] }} / {{ project.database[1] }}
      </template>
      <template #status="{ record: project }">
        <template v-if="project.thread === 0">
          <a-badge status="error" />
          <span style="color: #f5222d">停止</span>
        </template>
        <template v-else>
          <a-badge status="success" />
          <span style="color: #52c41a">运行中</span>
        </template>
      </template>
      <template #operation="{ record: project }">
        <a-button
          type="primary"
          size="small"
          :disabled="project.status === 'loading'"
          :loading="project.status === 'loading'"
          @click="api.sync(project.key)"
        >
          <template #icon><SyncOutlined /></template>
          &nbsp;同步
        </a-button>
        <a-button
          v-if="project.thread"
          class="ml-5"
          size="small"
          danger
          @click="api.stop(project.key)"
        >
          <template #icon><PoweroffOutlined /></template>
          &nbsp;停止
        </a-button>
      </template>
    </EditableTable>
  </LytMain>
</template>

<script lang="ts">
import Project from '@/types/project'
import { defineComponent, ref, onMounted, reactive } from 'vue'
import { mapper, emitter, columns } from './Home'
import LytMain from '../layouts/LytMain.vue'
import EditableTable from '../components/com/EditableTable.vue'
import { SyncOutlined, PoweroffOutlined } from '@ant-design/icons-vue'
import Database from '../types/database'
import { pjtAPI as api } from '../apis'

export default defineComponent({
  name: 'Home',
  components: {
    LytMain,
    EditableTable,
    SyncOutlined,
    PoweroffOutlined
  },
  setup() {
    const projects = ref([])
    const loading = ref(false)

    async function onEditStart() {
      mapper.database.options = (await api.databases()).map((database: Database) => ({
        value: database.name,
        label: database.name,
        children: database.dbs.map((db: string) => ({
          value: db,
          label: db
        }))
      }))
    }
    return {
      Project,

      loading,
      projects,
      api,
      mapper,
      emitter,
      columns,

      onEditStart
    }
  }
})
</script>

<style lang="less">
.home {
  height: 100%;
  padding: 5vh 10vw;
}

.project-list {
  height: 100%;
}

.ant-list-item-meta-avatar {
  line-height: 48px;
  vertical-align: middle;
}
</style>
