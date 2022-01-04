<template>
<div class="project">
  <a-descriptions>
    <template #title>
      <a-row>
        <a-col :span="12">
          <a-space>
            <a-button type="text" @click="router.push('/')">
              <arrow-left-outlined />
            </a-button>
            <h3 class="mb-0">{{editProj.current.name}}</h3>
            <a-button type="link" @click="editProj.show = true">
              <setting-outlined/>
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
          <a-button
            type="primary"
            :disabled="syncingProj || stoppingProj || startingSvc"
            :loading="syncingProj || startingSvc"
            @click="onProjSync"
          >
            <template #icon><SyncOutlined/></template>&nbsp;同步
          </a-button>
          <a-button
            v-if="editProj.current.thread"
            class="ml-5" danger
            :disabled="syncingProj || stoppingProj"
            :loading="stoppingProj"
            @click="onProjStop"
          >
            <template #icon><PoweroffOutlined/></template>&nbsp;停止
          </a-button>
        </a-col>
      </a-row>
    </template>
    <a-descriptions-item label="描述" :span="3">
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
    <a-descriptions-item label="状态">
      <template v-if="startingSvc">
        <a-spin size="small"/>&nbsp;启动中……
      </template>
      <a-badge v-else
        :status="editProj.current.thread ? 'processing' : 'default'"
        :text="editProj.current.thread ? '运行中' : '已停止'"
      />
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
        <template #flow="{ record: route }">
          <a-button @click="router.push(`/project/${editProj.current.key}/process/${route.key}`)">
            <template #icon><ApartmentOutlined /></template>&nbsp;流程设计
          </a-button>
        </template>
      </EditTable>
    </template>
  </EditTable>
</div>
</template>

<script lang="ts">
import { Model, Project, Property, Route } from '@/common'
import { makeRequest, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import { createVNode, defineComponent, onMounted, reactive, ref } from 'vue'
import {
  SettingOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  PoweroffOutlined,
  ArrowLeftOutlined,
  ApartmentOutlined
} from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
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
    SyncOutlined,
    PoweroffOutlined,
    ArrowLeftOutlined,
    ApartmentOutlined
  },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const editProj = reactive(new EditProjFormDlg())
    const pid = route.params.pid
    const modelTable = reactive(new ModelTable())
    const propTable = reactive(new PropTable())
    const routeTable = reactive(new RouteTable())
    const syncingProj = ref(false)
    const stoppingProj = ref(false)
    const startingSvc = ref(false)

    onMounted(refresh)

    async function refresh () {
      await editProj.initialize()
      Project.copy((await reqGet('project', pid)).data, editProj.current)
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
      onProjectChange(model, ['project', pid], ['model', ''])
    }
    function onModelDel (iden: any) {
      onProjectChange(null, ['project', pid], ['model', iden])
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
      await reqPut('project', pid, project, { ignores: ['models'] }),
      await refresh()
    }
    function onProjSync () {
      Modal.confirm({
        title: '确定同步项目到服务器？',
        icon: createVNode(ExclamationCircleOutlined),
        content: createVNode('div', {
          style: 'color:red;'
        }, '同步过程中，该项目已有的API将暂时停用！'),
        onOk: async () => {
          await makeRequest(axios.put(`/server-package/api/v1/project/${pid}/sync`), {
            middles: {
              before: () => {
                syncingProj.value = true
              },
              after: () => {
                syncingProj.value = false
              }
            },
            messages: {
              loading: '同步中……',
              succeed: '同步成功！'
            }
          })
          await refresh()

          startingSvc.value = true
          const h = setInterval(async () => {
            try {
              await axios.get(`/${editProj.current.name}/mdl/v1`)
            } catch (e) {
              console.log(`等待项目${editProj.current.name}启动……`)
            }
            clearInterval(h)
            startingSvc.value = false
          }, 1000)
        },
      })
    }
    function onProjStop () {
      Modal.confirm({
        title: '是否停止项目？',
        icon: createVNode(ExclamationCircleOutlined),
        content: '项目实例所提供的API服务也将同时停止！',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          await makeRequest(axios.put(`/server-package/api/v1/project/${pid}/stop`), {
            middles: {
              before: () => {
                stoppingProj.value = true
              },
              after: () => {
                stoppingProj.value = false
              }
            },
            messages: {
              loading: '停止中……',
              succeed: '操作成功！'
            }
          })
          await refresh()
        },
      })
    }
    return {
      router,
      syncingProj,
      stoppingProj,
      editProj,
      modelTable,
      propTable,
      routeTable,
      startingSvc,

      onModelSave,
      onModelDel,
      onPropSave,
      onPropDel,
      onRouteSave,
      onRouteDel,
      genPathByRoute,
      onCurProjConfig,
      onProjSync,
      onProjStop,
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
