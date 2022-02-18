<template>
  <div class="container">
    <a-page-header
      class="demo-page-header"
      style="border: 1px solid rgb(235, 237, 240)"
      :title="project.name"
      :sub-title="project.desc"
      @back="() => router.go(-1)"
    >
      <template #tags>
        <template v-if="project.status === 'loading'">
          <a-spin size="small" />
          &nbsp;启动中……
        </template>
        <a-tag v-else-if="project.thread" color="#87d068">运行中</a-tag>
        <a-tag v-else color="#f50">已停止</a-tag>
      </template>
      <template #extra>
        <a-button @click="$router.push(`/server-package/project/${project.key}/authorization`)">
          <KeyOutlined />
          &nbsp;权限管理
        </a-button>
        <a-button
          @click="
            () => {
              projForm.show = true
            }
          "
        >
          <SettingOutlined />
        </a-button>
        <FormDialog
          title="配置项目"
          :copy="Project.copy"
          :show="projForm.show"
          :mapper="projForm.mapper"
          :object="project"
          @update:show="
            show => {
              projForm.show = show
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
            @click="transferForm.show = true"
          >
            <template #icon><UploadOutlined /></template>
            &nbsp;传输文件
          </a-button>
        </a-tooltip>
        <FormDialog
          title="投放文件"
          :copy="Transfer.copy"
          :show="transferForm.show"
          :mapper="transferForm.mapper"
          :emitter="transferForm.emitter"
          @update:show="
            show => {
              transferForm.show = show
            }
          "
          @submit="onTransfer"
        />
        <a-button v-if="project.thread" class="ml-5" danger @click="onStop">
          <template #icon><PoweroffOutlined /></template>
          &nbsp;停止
        </a-button>
        <a-button v-show="false" class="ml-5" @click="deployForm.show = true">
          <template #icon><BuildOutlined /></template>
          &nbsp;部署前端
        </a-button>
        <FormDialog
          title="部署配置"
          :copy="Deploy.copy"
          :show="deployForm.show"
          :mapper="deployForm.mapper"
          :object="project.frontend"
          @update:show="
            show => {
              deployForm.show = show
            }
          "
          @submit="onDeploy"
        />
      </template>
      <a-descriptions size="small" :column="3">
        <a-descriptions-item label="占用端口">
          {{ project.port }}
        </a-descriptions-item>
        <a-descriptions-item label="路由前缀">/{{ project.name }}</a-descriptions-item>
        <a-descriptions-item label="数据库">
          {{ project.database.join('/') }}
        </a-descriptions-item>
      </a-descriptions>
    </a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ProjForm } from '../views/Home'
import { DeployForm, onStop, onSync, Transfer, TransferForm } from '../views/Project'
import {
  SyncOutlined,
  PoweroffOutlined,
  SettingOutlined,
  BuildOutlined,
  UploadOutlined,
  KeyOutlined
} from '@ant-design/icons-vue'
import FormDialog from '../components/com/FormDialog.vue'
import { useStore } from 'vuex'
import Project from '@/types/project'
import Deploy from '@/types/deploy'

export default defineComponent({
  name: 'ProjectLayout',
  components: {
    FormDialog,
    SyncOutlined,
    PoweroffOutlined,
    SettingOutlined,
    BuildOutlined,
    UploadOutlined,
    KeyOutlined
  },
  setup() {
    const router = useRouter()
    const store = useStore()
    const project = computed(() => store.getters['project/ins'] as Project)
    const projForm = reactive(new ProjForm())
    const deployForm = reactive(new DeployForm())
    const transferForm = reactive(new TransferForm())

    onMounted(async () => {
      await projForm.initialize()
    })

    return {
      Project,
      Deploy,
      Transfer,

      router,
      project,
      projForm,
      deployForm,
      transferForm,

      onConfig: (pjt: Project) => store.dispatch('project/save', pjt),
      onSync,
      onStop,
      onDeploy: (config: Deploy) => store.dispatch('project/deploy', config),
      onTransfer: async (info: Transfer, reset: () => void) => {
        await store.dispatch('project/transfer', info)
        reset()
      }
    }
  }
})
</script>
