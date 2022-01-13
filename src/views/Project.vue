<template>
<ProjDetail>
  <EditTable
    title="模型"
    dsKey="project/ins.models"
    :columns="modelTable.columns"
    :mapper="modelTable.mapper"
    :copy="Model.copy"
    v-model:expanded-row-keys="modelTable.expandeds"
    @save="onModelSave"
    @delete="onModelDel"
  >
    <template #expandedRowRender="{ record: model }">
      <EditTable
        title="字段"
        :dsKey="`project/ins.models.[${model.key}].props`"
        :columns="propTable.columns"
        :mapper="propTable.mapper"
        :copy="Property.copy"
        @save="(prop) => onPropSave(prop, model.key)"
        @delete="(key) => onPropDel(key, model.key)"
      />
      <EditTable
        title="接口"
        :dsKey="`project/ins.models.[${model.key}].routes`"
        :columns="routeTable.columns"
        :mapper="routeTable.mapper"
        :copy="Route.copy"
        @save="(route) => onRouteSave(route, model.key)"
        @delete="(key) => onRouteDel(key, model.key)"
      >
        <!-- <template #path="{ record: route }">
          {{ genPathByRoute(route.method, `${project.path}/${model.name}`) }}
        </template> -->
        <template #flow="{ record: route }">
          <a-button @click="() => router.push(`/flow/${route.key}`)">
            <template #icon><ApartmentOutlined /></template>&nbsp;流程设计
          </a-button>
        </template>
      </EditTable>
    </template>
  </EditTable>
</ProjDetail>
</template>

<script lang="ts">
import { Model, Project, Property, Route } from '@/common'
import { reqDelete, reqLink, reqPost, reqPut } from '@/utils'
import { computed, defineComponent, onMounted, reactive } from 'vue'
import { ApartmentOutlined } from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import EditTable from '../components/com/EditTable.vue'
import ProjDetail from '../layouts/ProjDetail.vue'
import { ModelTable, PropTable, RouteTable } from './Project'
import { useStore } from 'vuex'

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
    const store = useStore()
    const pid = route.params.pid as string
    const project = computed(() => store.getters['project/ins'] as Project)
    const modelTable = reactive(new ModelTable())
    const propTable = reactive(new PropTable())
    const routeTable = reactive(new RouteTable())

    onMounted(() => store.dispatch('project/refresh', pid))

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
          return store.dispatch('project/refresh')
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
      return store.dispatch('project/refresh')
    }
    function onModelSave (model: Model) {
      onProjectChange(model, ['project', pid], ['models', 'model'])
    }
    function onModelDel (key: any) {
      onProjectChange('model', ['project', pid], ['models', key])
    }
    function onPropSave (prop: Property, mid: string) {
      onProjectChange(prop, ['model', mid], ['props', 'property'])
    }
    function onPropDel (key: any, mid: string) {
      onProjectChange('property', ['model', mid], ['props', key])
    }
    function onRouteSave (route: Route, mid: string) {
      onProjectChange(route, ['model', mid], ['routes', 'route'], ['flow'])
    }
    function onRouteDel (key: any, mid: string) {
      onProjectChange('route', ['model', mid], ['routes', key])
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
      project,
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
