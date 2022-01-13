<template>
  <div class="home">
    <a-row type="flex">
      <a-col flex="auto">
        <div style="text-align: left; line-height: 34px; vertical-align: middle">
          <h3 style="margin-bottom: 0">项目列表</h3>
        </div>
      </a-col>
      <a-col flex="20vw">
        <div style="text-align: right">
          <a-button type="primary" @click="projForm.show = true" :disabled="loading">
            添加项目
          </a-button>
          <FormDialog
            title="添加项目"
            :copy="Project.copy"
            :show="projForm.show"
            :mapper="projForm.mapper"
            :object="projForm.editProj"
            @update:show="(show) => { projForm.show = show }"
            @submit="onNewProjSubmit"
          />
        </div>
      </a-col>
    </a-row>
    <a-list
      class="project-list"
      item-layout="horizontal"
      :data-source="projects"
      :loading="loading"
    >
      <template #renderItem="{ item }">
        <a-list-item>
          <template #actions>
            <a-popconfirm
              title="确定删除该项目？"
              ok-text="确定"
              cancel-text="取消"
              @confirm="onDelProjSubmit(item._id)"
            >
              <a href="#">删除</a>
            </a-popconfirm>
          </template>
          <a-list-item-meta :description="item.desc">
            <template #title>
              <a :href="`/project/${item._id}`">{{ item.name }}</a>
            </template>
            <template #avatar>
              <a-badge :status="item.thread ? 'processing' : 'default'"/>
            </template>
          </a-list-item-meta>
          <div>{{ item.port }}</div>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, reactive } from 'vue'
import FormDialog from '../components/com/FormDialog.vue'
import { Project } from '@/common'
import { makeRequest, reqGet, reqPost } from '../utils'
import { ProjForm } from './Home'
import axios from 'axios'

export default defineComponent({
  name: 'Home',
  components: {
    FormDialog
  },
  setup () {
    const projects = ref([])
    const projForm = reactive(new ProjForm())
    const loading = ref(false)

    onMounted(refresh)

    async function refresh () {
      await projForm.initialize()
      projects.value = (await reqGet('projects')).data
    }
    async function onNewProjSubmit (project: Project) {
      await reqPost('project', project, {
        middles: {
          before: () => { loading.value = true },
          after: () => { loading.value = false }
        }
      })
      await refresh()
    }
    async function onDelProjSubmit (pid: string) {
      await makeRequest(axios.delete(`/server-package/api/v1/project/${pid}`), {
        middles: {
          before: () => { loading.value = true },
          after: () => { loading.value = false }
        }
      })
      await refresh()
    }
    return {
      Project,

      loading,
      projects,
      projForm,

      onNewProjSubmit,
      onDelProjSubmit
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
