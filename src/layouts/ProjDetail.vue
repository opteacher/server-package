<template>
<div class="project">
  <a-page-header
    class="demo-page-header"
    style="border: 1px solid rgb(235, 237, 240)"
    :title="editProj.current.name"
    :sub-title="editProj.current.desc"
    @back="() => router.go(-1)"
  >
    <template #extra>
      <a-button @click="() => editProj.display(true)">
        <SettingOutlined/>
      </a-button>
      <FormDialog
        title="配置项目"
        :show="editProj.show"
        :mapper="editProj.mapper"
        :object="editProj.current"
        @update:show="(show) => editProj.display(show)"
        @submit="(project) => editProj.onConfig(project)"
      />
      <a-button
        type="primary"
        :disabled="editProj.current.status === 'starting'"
        :loading="editProj.current.status === 'starting'"
        @click="() => editProj.onSync()"
      >
        <template #icon><SyncOutlined/></template>&nbsp;同步
      </a-button>
      <a-button
        v-if="editProj.current.thread"
        class="ml-5" danger
        :disabled="editProj.current.status === 'stopping'"
        :loading="editProj.current.status === 'stopping'"
        @click="() => editProj.onStop()"
      >
        <template #icon><PoweroffOutlined/></template>&nbsp;停止
      </a-button>
    </template>
    <a-descriptions size="small" :column="3">
      <!-- <a-descriptions-item label="描述">
        {{ editProj.current.desc }}
      </a-descriptions-item> -->
      <a-descriptions-item label="占用端口">
        {{ editProj.current.port }}
      </a-descriptions-item>
      <a-descriptions-item label="API前缀">
        {{ editProj.current.path }}
      </a-descriptions-item>
      <a-descriptions-item label="数据库">
        {{ editProj.current.database.join('/') }}
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <template v-if="editProj.current.status === 'starting'">
          <a-spin size="small"/>&nbsp;启动中……
        </template>
        <a-badge v-else
          :status="editProj.current.thread ? 'processing' : 'default'"
          :text="editProj.current.thread ? '运行中' : '已停止'"
        />
      </a-descriptions-item>
    </a-descriptions>
  </a-page-header>
  <slot/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { EditProjFormDlg } from '../views/Home'
import { SyncOutlined, PoweroffOutlined, SettingOutlined } from '@ant-design/icons-vue'
import FormDialog from '../components/com/FormDialog.vue'
export default defineComponent({
  name: 'ProjectLayout',
  components: {
    FormDialog,
    SyncOutlined,
    PoweroffOutlined,
    SettingOutlined
  },
  props: {
    editProj: { type: EditProjFormDlg, required: true}
  },
  setup () {
    const router = useRouter()
    return {
      router
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
