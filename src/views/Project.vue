<template>
<ProjDetail>
  <EditableTable
    title="模型"
    dsKey="project/ins.models"
    :columns="modelTable.columns"
    :mapper="modelTable.mapper"
    :copy="Model.copy"
    :emitter="emitter"
    v-model:expanded-row-keys="modelTable.expandeds"
    @save="onModelSave"
    @delete="onModelDel"
  >
    <template #dataset="{ record: model }">
      <a-button @click="router.push(`/server-package/project/${pid}/dataset/${model.key}`)">
        <template #icon><DatabaseOutlined /></template>&nbsp;数据浏览
      </a-button>
    </template>
    <template #expandedRowRender="{ record: model }">
      <EditableTable
        title="字段"
        :dsKey="`project/ins.models.[${model.key}].props`"
        :columns="propTable.columns"
        :mapper="propTable.mapper"
        :copy="Property.copy"
        :emitter="emitter"
        @save="(prop) => onPropSave(prop, model.key)"
        @delete="(key) => onPropDel(key, model.key)"
      />
      <EditableTable
        title="接口"
        :dsKey="`project/ins.models.[${model.key}].routes`"
        :columns="routeTable.columns"
        :mapper="routeTable.mapper"
        :copy="Route.copy"
        :emitter="emitter"
        @save="(route) => onRouteSave(route, model.key)"
        @delete="(key) => onRouteDel(key, model.key)"
      >
        <template #path="{ record: route }">
          <div class="editable-cell">
            <div v-if="editRoute.key === route.key" class="editable-cell-input-wrapper">
              <a-input v-model:value="editRoute.path" @pressEnter="onPathSaved(true)" />
              <CheckOutlined class="editable-cell-icon" style="right: 20px" @click="onPathSaved(true)" />
              <CloseOutlined class="editable-cell-icon" style="right: 0" @click="onPathSaved(false)"/>
            </div>
            <div v-else class="editable-cell-text-wrapper">
              {{ route.path || genMdlPath(model, route) }}
              <EditOutlined class="editable-cell-icon" style="right: 0"
                @click="onPathEdited(model, route)"
              />
            </div>
          </div>
        </template>
        <template #flow="{ record: route }">
          <a-button @click="() => router.push(`/server-package/project/${pid}/flow/${route.key}`)">
            <template #icon><ApartmentOutlined /></template>&nbsp;流程设计
          </a-button>
        </template>
      </EditableTable>
    </template>
  </EditableTable>
</ProjDetail>
</template>

<script lang="ts">
import { Model, Project, Property, Route } from '@/common'
import { computed, defineComponent, onMounted, reactive } from 'vue'
import {
  ApartmentOutlined,
  CheckOutlined,
  EditOutlined,
  DatabaseOutlined,
  CloseOutlined
} from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import EditableTable from '../components/com/EditableTable.vue'
import ProjDetail from '../layouts/ProjDetail.vue'
import { ModelTable, PropTable, RouteTable } from './Project'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export default defineComponent({
  name: 'Project',
  components: {
    EditableTable,
    ProjDetail,
    ApartmentOutlined,
    CheckOutlined,
    EditOutlined,
    DatabaseOutlined,
    CloseOutlined
  },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const emitter = new Emitter()
    const pid = route.params.pid as string
    const project = computed(() => store.getters['project/ins'] as Project)
    const modelTable = reactive(new ModelTable())
    const propTable = reactive(new PropTable())
    const routeTable = reactive(new RouteTable())
    const editRoute = reactive(new Route())

    onMounted(() => store.dispatch('project/refresh', pid))

    async function onModelSave (model: Model) {
      await store.dispatch('project/update', {
        opera: model,
        parent: ['project', pid],
        child: ['models', 'model'],
        ignores: ['props', 'routes']
      })
      emitter.emit('refresh')
    }
    async function onModelDel (key: any) {
      await store.dispatch('project/update', {
        opera: 'model',
        parent: ['project', pid],
        child: ['models', key]
      })
      emitter.emit('refresh')
    }
    async function onPropSave (prop: Property, mid: string) {
      await store.dispatch('project/update', {
        opera: prop,
        parent: ['model', mid],
        child: ['props', 'property']
      })
      emitter.emit('refresh')
    }
    async function onPropDel (key: any, mid: string) {
      await store.dispatch('project/update', {
        opera: 'property',
        parent: ['model', mid],
        child: ['props', key]
      })
      emitter.emit('refresh')
    }
    async function onRouteSave (route: Route, mid: string) {
      if (!route.path) {
        route.path = RouteTable.genMdlPath(store.getters['project/model'](mid), route)
      }
      await store.dispatch('project/update', {
        opera: route,
        parent: ['model', mid],
        child: ['routes', 'route'],
        ignores: ['flow']
      })
      emitter.emit('refresh')
    }
    async function onRouteDel (key: any, mid: string) {
      await store.dispatch('project/update', {
        opera: 'route',
        parent: ['model', mid],
        child: ['routes', key],
      })
      emitter.emit('refresh')
    }
    async function onPathSaved (save: boolean) {
      if (save) {
        await store.dispatch('project/setRoutePath', editRoute)
      }
      editRoute.reset()
      emitter.emit('refresh')
    }
    function onPathEdited (model: Model, route: Route) {
      editRoute.key = route.key
      editRoute.path = route.path || RouteTable.genMdlPath(model, route)
    }
    return {
      Model,
      Property,
      Route,

      pid,
      router,
      emitter,
      project,
      modelTable,
      propTable,
      routeTable,
      editRoute,

      onModelSave,
      onModelDel,
      onPropSave,
      onPropDel,
      onRouteSave,
      onRouteDel,
      genMdlPath: RouteTable.genMdlPath,
      onPathSaved,
      onPathEdited
    }
  }
})
</script>

<style lang="less" scoped>
.editable-cell {
  position: relative;
  .editable-cell-input-wrapper,
  .editable-cell-text-wrapper {
    padding-right: 48px;
  }

  .editable-cell-text-wrapper {
    padding: 5px 48px 5px 5px;
  }

  .editable-cell-icon {
    position: absolute;
    width: 20px;
    cursor: pointer;
    line-height: 28px;
  }

  .editable-cell-icon {
    display: none;
  }

  .editable-cell-icon:hover {
    color: #108ee9;
  }

  .editable-add-btn {
    margin-bottom: 8px;
  }
}
.editable-cell:hover .editable-cell-icon {
  display: inline-block;
}
</style>
