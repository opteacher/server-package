<template>
<ProjDetail :editProj="editProj">
  <EditTable
    title="模型"
    :data="editProj.current.models"
    :cols="modelTable.columns"
    :dataMapper="modelTable.mapper"
    :copy="Model.copy"
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
        :copy="Property.copy"
        @save="onPropSave"
        @delete="onPropDel"
      />
      <EditTable
        title="接口"
        :extra="model.key"
        :data="model.routes"
        :cols="routeTable.columns"
        :dataMapper="routeTable.mapper"
        :copy="Route.copy"
        @save="onRouteSave"
        @delete="onRouteDel"
      >
        <!-- <template #path="{ record: route }">
          {{ genPathByRoute(route.method, `${editProj.current.path}/${model.name}`) }}
        </template> -->
        <template #flow="{ record: route }">
          <a-button @click="() => {
            router.push(`/flow/${route.key}`)
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
import { reqDelete, reqLink, reqPost, reqPut } from '@/utils'
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

    async function onProjectChange (
      operChild: any,
      parent: [string, any],
      child: [string, any],
      ignores?: string[]
    ) {
      if (typeof operChild !== 'string') {
        if (operChild.key) {
          // 更新
          await reqPut(child[1], operChild.key, operChild)
          return editProj.refresh()
        } else {
          // 新增
          const newOne = (await reqPost(child[1], operChild, { ignores })).data
          child[1] = newOne._id
        }
      } else {
        // 删除
        await reqDelete(operChild, child[1])
      }
      await reqLink({ parent, child }, operChild as boolean)
      return editProj.refresh()
    }
    function onModelSave (model: Model) {
      onProjectChange(model, ['project', pid], ['models', 'model'])
    }
    function onModelDel (iden: any) {
      onProjectChange('model', ['project', pid], ['models', iden])
    }
    function onPropSave (prop: Property, mid: string) {
      onProjectChange(prop, ['model', mid], ['props', 'property'])
    }
    function onPropDel (iden: any, mid: string) {
      onProjectChange('property', ['model', mid], ['props', iden])
    }
    function onRouteSave (route: Route, mid: string) {
      onProjectChange(route, ['model', mid], ['routes', 'route'], ['flow'])
    }
    function onRouteDel (iden: any, mid: string) {
      onProjectChange('route', ['model', mid], ['routes', iden])
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
      Model,
      Property,
      Route,

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
