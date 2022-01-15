<template>
<div class="project">
  <a-page-header
    class="demo-page-header"
    style="border: 1px solid rgb(235, 237, 240)"
    :title="project.name"
    :sub-title="project.desc"
    @back="() => router.go(-1)"
  >
    <template #extra>
      <a-button @click="() => { projForm.show = true }">
        <SettingOutlined/>
      </a-button>
      <FormDialog
        title="配置项目"
        :copy="Project.copy"
        :show="projForm.show"
        :mapper="projForm.mapper"
        :object="project"
        @update:show="(show) => { projForm.show = show }"
        @submit="onConfig"
      />
      <a-button
        type="primary"
        :disabled="project.status === 'starting'"
        :loading="project.status === 'starting'"
        @click="onSync"
      >
        <template #icon><SyncOutlined/></template>&nbsp;同步
      </a-button>
      <a-button
        v-if="project.thread"
        class="ml-5" danger
        :disabled="project.status === 'stopping'"
        :loading="project.status === 'stopping'"
        @click="onStop"
      >
        <template #icon><PoweroffOutlined/></template>&nbsp;停止
      </a-button>
      <a-button class="ml-5" @click="deployForm.show = true">
        <template #icon><BuildOutlined /></template>&nbsp;部署前端
      </a-button>
      <FormDialog
        title="部署配置"
        :copy="Deploy.copy"
        :show="deployForm.show"
        :mapper="deployForm.mapper"
        :object="project.frontend"
        @update:show="(show) => { deployForm.show = show }"
        @submit="onDeploy"
      />
    </template>
    <a-descriptions size="small" :column="3">
      <!-- <a-descriptions-item label="描述">
        {{ project.desc }}
      </a-descriptions-item> -->
      <a-descriptions-item label="占用端口">
        {{ project.port }}
      </a-descriptions-item>
      <a-descriptions-item label="API前缀">
        {{ project.path }}
      </a-descriptions-item>
      <a-descriptions-item label="数据库">
        {{ project.database.join('/') }}
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <template v-if="project.status === 'starting'">
          <a-spin size="small"/>&nbsp;启动中……
        </template>
        <a-badge v-else
          :status="project.thread ? 'processing' : 'default'"
          :text="project.thread ? '运行中' : '已停止'"
        />
      </a-descriptions-item>
    </a-descriptions>
  </a-page-header>
  <slot/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ProjForm } from '../views/Home'
import { DeployForm } from '../views/Project'
import { SyncOutlined, PoweroffOutlined, SettingOutlined, BuildOutlined } from '@ant-design/icons-vue'
import FormDialog from '../components/com/FormDialog.vue'
import { useStore } from 'vuex'
import { Project, Deploy } from '@/common'

export default defineComponent({
  name: 'ProjectLayout',
  components: {
    FormDialog,
    SyncOutlined,
    PoweroffOutlined,
    SettingOutlined,
    BuildOutlined
  },
  setup () {
    const router = useRouter()
    const store = useStore()
    const project = computed(() => store.getters['project/ins'] as Project)
    const projForm = reactive(new ProjForm())
    const deployForm = reactive(new DeployForm())

    onMounted(async () => {
      await projForm.initialize()
    })

    return {
      Project,
      Deploy,

      router,
      project,
      projForm,
      deployForm,

      onConfig: (pjt: Project) => store.dispatch('project/save', pjt),
      onSync: () => store.dispatch('project/sync'),
      onStop: () => store.dispatch('project/stop'),
      onDeploy: (config: Deploy) => store.dispatch('project/deploy', config)
    }
  }
})
</script>

<style lang="less" scoped>
.project {
  height: 100%;
  padding: 50px 100px;
}
</style>
