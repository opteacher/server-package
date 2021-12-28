<template>
<div class="project">
  <a-descriptions>
    <template #title>
      <a-row>
        <a-col :span="12">
          <a-space>
            <h3 class="mb-0">{{editProj.current.name}}</h3>
            <a-button type="link" @click="editProj.show = true">
              <template #icon><SettingOutlined/></template>
            </a-button>
            <FormDialog
              title="添加项目"
              :show="editProj.show"
              :mapper="editProj.mapper"
              :object="editProj.current"
              @update:show="(show) => { editProj.show = show }"
              @submit="onCurProjConfig"
            />
          </a-space>
        </a-col>
        <a-col :span="12" class="text-right">
          <a-button type="primary" :disabled="syncProj" :loading="syncProj" @click="onProjSync">
            <template #icon><SyncOutlined/></template>&nbsp;同步
          </a-button>
        </a-col>
      </a-row>
    </template>
    <a-descriptions-item label="描述">
      {{ editProj.current.desc }}
    </a-descriptions-item>
    <a-descriptions-item label="占用端口">
      {{ editProj.current.port }}
    </a-descriptions-item>
    <a-descriptions-item label="API前缀">
      {{ editProj.current.path }}
    </a-descriptions-item>
    <a-descriptions-item label="数据库">
      {{ editProj.current.database.join('/') }}
    </a-descriptions-item>
  </a-descriptions>
  <EditTable
    title="模型"
    :data="editProj.current.models"
    :cols="modelTable.columns"
    :dataMapper="modelTable.mapper"
    :dftRecord="modelTable.current"
    v-model:expanded-row-keys="modelTable.expandeds"
    @save="onModelSave"
    @delete="onModelDel"
  >
    <template #expandedRowRender="{ record }">
      <EditTable
        title="字段"
        :extra="record.key"
        :data="record.props"
        :cols="propTable.columns"
        :dataMapper="propTable.mapper"
        :dftRecord="propTable.current"
        @save="onPropSave"
        @delete="onPropDel"
      />
      <EditTable
        title="接口"
        :extra="record.key"
        :data="record.routes"
        :cols="routeTable.columns"
        :dataMapper="routeTable.mapper"
        :dftRecord="routeTable.current"
        @save="onRouteSave"
        @delete="onRouteDel"
      >
        <template #path="{ record: route }">
          {{ genPathByRoute(route.method, `${editProj.current.path}/${record.name}`) }}
        </template>
      </EditTable>
    </template>
  </EditTable>
</div>
</template>

<script lang="ts">
import { Model, Project, Property, Route } from '@/common'
import { makeRequest, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import { computed, createVNode, defineComponent, onMounted, reactive, ref } from 'vue'
import { SettingOutlined, SyncOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { useRoute } from 'vue-router'
import EditTable from '../components/com/EditTable.vue'
import FormDialog from '../components/com/FormDialog.vue'
import { ModelTable, PropTable, RouteTable } from './Project'
import { EditProjFormDlg } from './Home'
import { Modal } from 'ant-design-vue'
import axios from 'axios'

export default defineComponent({
  name: 'Project',
  components: {
    EditTable,
    FormDialog,
    SettingOutlined,
    SyncOutlined
  },
  setup () {
    const router = useRoute()
    const editProj = reactive(new EditProjFormDlg())
    const pid = computed(() => router.params.pid)
    const modelTable = reactive(new ModelTable())
    const propTable = reactive(new PropTable())
    const routeTable = reactive(new RouteTable())
    const syncProj = ref(false)

    onMounted(refresh)

    async function refresh () {
      await editProj.initialize()
      Project.copy((await reqGet('project', pid.value)).data, editProj.current)
      for (const index in editProj.current.models) {
        const model = editProj.current.models[index]
        Model.copy((await reqGet('model', model.key)).data, model)
      }
    }
    async function onProjectChange (operChild: any, parent: [string, any], child: [string, any]) {
      if (operChild) {
        if (operChild.key) {
          // 更新
          await reqPut(child[0], operChild.key, operChild)
          return refresh()
        } else {
          // 新增
          const newOne = (await reqPost(child[0], operChild)).data
          child[1] = newOne._id
        }
      }
      await reqLink({ parent, child }, operChild as boolean)
      await refresh()
    }
    function onModelSave (model: Model) {
      onProjectChange(model, ['project', pid.value], ['model', ''])
    }
    function onModelDel (iden: any) {
      onProjectChange(null, ['project', pid.value], ['model', iden])
    }
    function onPropSave (prop: Property, mid: string) {
      onProjectChange(prop, ['model', mid], ['property', ''])
    }
    async function onPropDel (iden: any, mid: string) {
      onProjectChange(null, ['model', mid], ['property', iden])
    }
    async function onRouteSave (route: Route, mid: string) {
      onProjectChange(route, ['model', mid], ['route', ''])
    }
    function onRouteDel (iden: any, mid: string) {
      onProjectChange(null, ['model', mid], ['route', iden])
    }
    function genPathByRoute (method: string, path: string): string {
      switch (method) {
      case 'POST':
        return `${path}`
      case 'DELETE':
      case 'PUT':
      case 'GET':
        return `${path}/:index`
      case 'ALL':
        return `${path}s`
      default:
        return ''
      }
    }
    async function onCurProjConfig (project: Project) {
      await reqPut('project', pid.value, project, { ignores: ['models'] }),
      await refresh()
    }
    function onProjSync () {
      Modal.confirm({
        title: '确定同步项目到服务器？',
        icon: createVNode(ExclamationCircleOutlined),
        content: createVNode('div', { style: 'color:red;' }, '同步过程中，该项目已有的API将暂时停用！'),
        onOk() {
          makeRequest(axios.put(`/server-package/api/v1/project/${pid.value}/sync`), {
            middles: {
              before: () => { syncProj.value = true },
              after: () => { syncProj.value = false }
            },
            messages: {
              loading: '同步中……',
              succeed: '同步成功！'
            }
          })
        },
      })
    }
    return {
      pid,
      syncProj,
      editProj,
      modelTable,
      propTable,
      routeTable,

      onModelSave,
      onModelDel,
      onPropSave,
      onPropDel,
      onRouteSave,
      onRouteDel,
      genPathByRoute,
      onCurProjConfig,
      onProjSync,
    }
  }
})
</script>

<style lang="less" scoped>
.project {
  height: 100%;
  padding: 5vh 10vw;
}
</style>
