<template>
<ProjDetail :editProj="editProj">
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
    <template #expandedRowRender="{ record: model }">
      <EditTable
        title="字段"
        :extra="model.key"
        :data="model.props"
        :cols="propTable.columns"
        :dataMapper="propTable.mapper"
        :dftRecord="propTable.current"
        @save="onPropSave"
        @delete="onPropDel"
      />
      <EditTable
        title="接口"
        :extra="model.key"
        :data="model.routes"
        :cols="routeTable.columns"
        :dataMapper="routeTable.mapper"
        :dftRecord="routeTable.current"
        @save="onRouteSave"
        @delete="onRouteDel"
      >
        <template #path="{ record: route }">
          {{ genPathByRoute(route.method, `${editProj.current.path}/${route.name}`) }}
        </template>
        <template #flow="{ record: route }">
          <a-button @click="() => {
            router.push([
            `/project/${editProj.current.key}`,
            `/model/${model.key}`,
            `/flow/${route.key}`
            ].join(''))
          }">
            <template #icon><ApartmentOutlined /></template>&nbsp;流程设计
          </a-button>
        </template>
      </EditTable>
    </template>
  </EditTable>
</ProjDetail>
</template>

<script lang="ts">
import { Model, Property, Route } from '@/common'
import { reqLink, reqPost, reqPut } from '@/utils'
import { defineComponent, onMounted, reactive } from 'vue'
import { ApartmentOutlined } from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import EditTable from '../components/com/EditTable.vue'
import ProjDetail from '../layouts/ProjDetail.vue'
import { ModelTable, PropTable, RouteTable } from './Project'
import { EditProjFormDlg } from './Home'

export default defineComponent({
  name: 'Project',
  components: {
    EditTable,
    ProjDetail,
    ApartmentOutlined
  },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const editProj = reactive(new EditProjFormDlg())
    const pid = route.params.pid as string
    const modelTable = reactive(new ModelTable())
    const propTable = reactive(new PropTable())
    const routeTable = reactive(new RouteTable())

    onMounted(() => editProj.refresh(pid))

    async function onProjectChange (operChild: any, parent: [string, any], child: [string, any]) {
      if (operChild) {
        if (operChild.key) {
          // 更新
          await reqPut(child[0], operChild.key, operChild)
          return editProj.refresh()
        } else {
          // 新增
          const newOne = (await reqPost(child[0], operChild)).data
          child[1] = newOne._id
        }
      }
      await reqLink({ parent, child }, operChild as boolean)
      await editProj.refresh()
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
    return {
      router,
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
    }
  }
})
</script>
