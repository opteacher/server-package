<template>
<ProjDetail>
  <EditableTable
    title="模型"
    dsKey="project/ins.models"
    :columns="ModelColumns"
    :mapper="ModelMapper"
    :copy="Model.copy"
    :emitter="emitter"
    @save="onModelSave"
    @delete="onModelDel"
  >
    <template #dataset="{ record: model }">
      <a-button
        @click="router.push(`/server-package/project/${pid}/dataset/${model.key}`)"
      >
        <template #icon><DatabaseOutlined /></template>&nbsp;数据浏览
      </a-button>
    </template>
    <template #expandedRowRender="{ record: model }">
      <EditableTable
        title="字段"
        :dsKey="`project/ins.models.[${model.key}].props`"
        :columns="PropColumns"
        :mapper="PropMapper"
        :copy="Property.copy"
        :emitter="emitter"
        @save="(prop) => onPropSave(prop, model.key)"
        @delete="(key) => onPropDel(key, model.key)"
      />
      <EditableTable
        title="接口"
        :dsKey="`project/ins.models.[${model.key}].apis`"
        :columns="ApiColumns"
        :mapper="ApiMapper"
        :copy="Service.copy"
        :emitter="emitter"
        @add="(api) => {
          api.model = model.name
          ApiMapper['path'].prefix = `/${project.name}`
        }"
        @edit="() => ApiMapper['path'].prefix = `/${project.name}`"
        @save="(api) => onApiSave(api, model.key)"
        @delete="(key) => onApiDel(key, model.key)"
      >
        <template #path="{ record: api }">
          /{{ project.name }}{{ api.path }}
        </template>
        <template #bind="{ record: api }">
          <template v-if="api.name && api.interface">
            {{ api.name }}&nbsp;/&nbsp;{{ api.interface }}
          </template>
          <template v-else>-</template>
        </template>
        <template #flow="{ record: api }">
          <a-button v-if="api.key && !api.isModel" @click="() => {
            router.push(`/server-package/project/${pid}/flow/${api.key}`)
          }">
            <template #icon><ApartmentOutlined /></template>&nbsp;流程设计
          </a-button>
          <template v-else>-</template>
        </template>
      </EditableTable>
    </template>
  </EditableTable>
</ProjDetail>
</template>

<script lang="ts">
import { Model, Project, Property, Service } from '@/common'
import { computed, defineComponent, onMounted, reactive } from 'vue'
import {
  ApartmentOutlined,
  DatabaseOutlined,
} from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import EditableTable from '../components/com/EditableTable.vue'
import ProjDetail from '../layouts/ProjDetail.vue'
import {
  ModelColumns, ModelMapper,
  PropColumns, PropMapper,
  ApiColumns, ApiMapper,
  genMdlPath,
} from './Project'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export default defineComponent({
  name: 'Project',
  components: {
    EditableTable,
    ProjDetail,
    ApartmentOutlined,
    DatabaseOutlined,
  },
  setup () {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const emitter = new Emitter()
    const pid = route.params.pid as string
    const project = computed(() => store.getters['project/ins'] as Project)
    const edtApi = reactive(new Service())

    onMounted(() => store.dispatch('project/refresh', pid))

    async function onModelSave (model: Model) {
      await store.dispatch('project/update', {
        opera: model,
        parent: ['project', pid],
        child: ['models', 'model'],
        ignores: ['props', 'apis']
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
    async function onApiSave (api: Service, mid: string) {
      if (!api.path) {
        api.path = genMdlPath(api)
      }
      const model = project.value.models.find((mdl: any) => mdl.key === mid)
      api.model = model?.name as string
      await store.dispatch('project/update', {
        opera: api,
        parent: ['model', mid],
        child: ['apis', 'service'],
        ignores: ['flow', 'deps']
      })
      emitter.emit('refresh')
    }
    async function onApiDel (key: any, mid: string) {
      await store.dispatch('project/update', {
        opera: 'service',
        parent: ['model', mid],
        child: ['apis', key],
      })
      emitter.emit('refresh')
    }
    return {
      Model,
      Property,
      Service,

      ModelColumns,
      ModelMapper,
      PropColumns,
      PropMapper,
      ApiColumns,
      ApiMapper,
      pid,
      router,
      emitter,
      project,
      edtApi,

      onModelSave,
      onModelDel,
      onPropSave,
      onPropDel,
      onApiSave,
      onApiDel,
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
