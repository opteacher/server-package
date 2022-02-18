<template>
  <LytProject>
    <EditableTable
      title="模型"
      dsKey="project/ins.models"
      :columns="ModelColumns"
      :mapper="ModelMapper"
      :copy="Model.copy"
      :emitter="modelEmitter"
      @save="onModelSave"
      @delete="onModelDel"
    >
      <template #dataset="{ record: model }">
        <a-button
          :disabled="project.status !== 'running'"
          @click.stop="router.push(`/server-package/project/${pid}/dataset/${model.key}`)"
        >
          <template #icon><DatabaseOutlined /></template>
          &nbsp;数据浏览
        </a-button>
      </template>
      <template #expCls="{ record: model }">
        <a-button
          @click.stop="
            () => {
              expClsForm.update(model)
              expClsVsb = true
            }
          "
        >
          <template #icon><ExportOutlined /></template>
          &nbsp;导出类
        </a-button>
      </template>
      <template #dsgnForm="{ record: model }">
        <a-button @click.stop="router.push(`/server-package/project/${pid}/form/${model.key}`)">
          <template #icon><FormOutlined /></template>
          &nbsp;表单设计
        </a-button>
      </template>
      <template #expandedRowRender="{ record: model }">
        <EditableTable
          title="字段"
          :dsKey="`project/ins.models.[${model.key}].props`"
          :columns="PropColumns"
          :mapper="PropMapper"
          :copy="Property.copy"
          :emitter="propEmitter"
          :filter="record => model.key !== project.auth?.model || record.name !== 'role'"
          @save="prop => onPropSave(prop, model.key)"
          @delete="key => onPropDel(key, model.key)"
        />
        <EditableTable
          class="mb-10"
          title="服务"
          :dsKey="`project/ins.models.[${model.key}].svcs`"
          :columns="ServiceColumns"
          :mapper="ServiceMapper"
          :copy="Service.copy"
          :emitter="svcEmitter"
          :filter="record => model.key !== project.auth?.model || record.name !== 'auth'"
          @add="
            svc => {
              svc.model = model.name
              ServiceMapper['path'].prefix = `/${project.name}`
            }
          "
          @edit="() => (ServiceMapper['path'].prefix = `/${project.name}`)"
          @save="svc => onSvcSave(svc, model.key)"
          @delete="key => onSvcDel(key, model.key)"
        >
          <template #path="{ record: svc }">/{{ project.name }}{{ svc.path }}</template>
          <template #emitCondEdit="{ editing: svc }">
            <a-input v-model:value="svc.cdValue" :min="1" placeholder="输入时间段或时间点">
              <template #addonAfter>
                <a-select
                  :options="timeUnits"
                  v-model:value="svc.cdUnit"
                  style="width: 80px"
                  placeholder="单位"
                />
              </template>
            </a-input>
          </template>
          <template #emitCond="{ record: svc }">
            {{
              svc.emit === 'timeout'
                ? `${svc.emitCond}后`
                : svc.emit === 'interval'
                ? `每${svc.emitCond}`
                : '-'
            }}
          </template>
          <template #bind="{ record: svc }">
            <template v-if="svc.name && svc.interface">
              {{ svc.name }}&nbsp;/&nbsp;{{ svc.interface }}
            </template>
            <template v-else>-</template>
          </template>
          <template #flow="{ record: svc }">
            <a-button
              v-if="svc.name === 'auth' && model.key === project.auth?.model"
              @click="router.push(`/server-package/project/${pid}/flow/${svc.key}`)"
            >
              <template #icon><EyeOutlined /></template>
              &nbsp;查看
            </a-button>
            <a-button
              v-else-if="svc.key && !svc.isModel"
              @click="router.push(`/server-package/project/${pid}/flow/${svc.key}`)"
            >
              <template #icon><ApartmentOutlined /></template>
              &nbsp;设计
            </a-button>
            <template v-else>-</template>
          </template>
          <template #ctrl="{ record: svc }">
            <template v-if="svc.emit === 'timeout' || svc.emit === 'interval'">
              <ul class="unstyled-list">
                <li class="mb-3">
                  <a-button
                    :size="svc.jobId ? 'small' : 'middle'"
                    type="primary"
                    :disabled="project.status !== 'running'"
                    @click="onSvcJobRest(svc)"
                  >
                    启动
                  </a-button>
                </li>
                <li v-if="svc.jobId">
                  <a-button
                    size="small"
                    danger
                    :disabled="project.status !== 'running'"
                    @click="onSvcJobStop(svc)"
                  >
                    停止
                  </a-button>
                </li>
              </ul>
            </template>
            <template v-if="svc.emit === 'api'">
              <a-button :disabled="project.status !== 'running'">测试</a-button>
            </template>
          </template>
        </EditableTable>
      </template>
    </EditableTable>
  </LytProject>
  <FormDialog
    title="导出类"
    :show="expClsVsb"
    :object="expClsForm"
    :copy="ExpClsForm.copy"
    :mapper="ExpClsMapper"
    @update:show="
      show => {
        expClsVsb = show
      }
    "
    @submit="formData => $store.dispatch('model/export', formData)"
  />
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Model, Project, Property, Service } from '@/common'
import { computed, defineComponent, onMounted } from 'vue'
import {
  ApartmentOutlined,
  DatabaseOutlined,
  ExportOutlined,
  FormOutlined,
  EyeOutlined
} from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import EditableTable from '../components/com/EditableTable.vue'
import LytProject from '../layouts/LytProject.vue'
import FormDialog from '../components/com/FormDialog.vue'
import {
  modelEmitter,
  ModelColumns,
  ModelMapper,
  propEmitter,
  PropColumns,
  PropMapper,
  svcEmitter,
  ServiceColumns,
  ServiceMapper,
  genMdlPath,
  timeUnits,
  expClsVsb,
  expClsForm,
  ExpClsMapper,
  ExpClsForm
} from './Project'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Project',
  components: {
    EditableTable,
    LytProject,
    FormDialog,
    ApartmentOutlined,
    DatabaseOutlined,
    ExportOutlined,
    FormOutlined,
    EyeOutlined
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const pid = route.params.pid as string
    const project = computed(() => store.getters['project/ins'] as Project)

    onMounted(() => store.dispatch('project/refresh', pid))

    async function onModelSave(model: Model) {
      await store.dispatch('project/update', {
        opera: model,
        parent: ['project', pid],
        child: ['models', 'model'],
        ignores: ['props', 'svcs'],
        isAPI: true
      })
      modelEmitter.emit('refresh')
    }
    async function onModelDel(key: any) {
      await store.dispatch('project/update', {
        opera: 'model',
        parent: ['project', pid],
        child: ['models', key],
        isAPI: true
      })
      modelEmitter.emit('refresh')
    }
    async function onPropSave(prop: Property, mid: string) {
      await store.dispatch('project/update', {
        opera: prop,
        parent: ['model', mid],
        child: ['props', 'property']
      })
      propEmitter.emit('refresh')
    }
    async function onPropDel(key: any, mid: string) {
      await store.dispatch('project/update', {
        opera: 'property',
        parent: ['model', mid],
        child: ['props', key]
      })
      propEmitter.emit('refresh')
    }
    async function onSvcSave(svc: Service, mid: string) {
      if (!svc.path) {
        svc.path = genMdlPath(svc)
      }
      svc.emitCond = `${svc.cdValue}${svc.cdUnit}`
      const model = project.value.models.find((mdl: any) => mdl.key === mid)
      svc.model = model?.name as string
      await store.dispatch('project/update', {
        opera: svc,
        parent: ['model', mid],
        child: ['svcs', 'service'],
        ignores: ['flow']
      })
      svcEmitter.emit('refresh')
    }
    async function onSvcDel(key: any, mid: string) {
      await store.dispatch('project/update', {
        opera: 'service',
        parent: ['model', mid],
        child: ['svcs', key]
      })
      svcEmitter.emit('refresh')
    }
    async function onSvcJobRest(svc: Service) {
      await store.dispatch('project/restartSvcJob', svc.key)
      svcEmitter.emit('refresh')
    }
    async function onSvcJobStop(svc: Service) {
      await store.dispatch('project/stopSvcJob', svc.key)
      svcEmitter.emit('refresh')
    }
    return {
      Model,
      Property,
      Service,
      ExpClsForm,

      modelEmitter,
      ModelColumns,
      ModelMapper,
      propEmitter,
      PropColumns,
      PropMapper,
      svcEmitter,
      ServiceColumns,
      ServiceMapper,
      pid,
      router,
      project,
      timeUnits,
      expClsVsb,
      expClsForm,
      ExpClsMapper,

      onModelSave,
      onModelDel,
      onPropSave,
      onPropDel,
      onSvcSave,
      onSvcDel,
      onSvcJobRest,
      onSvcJobStop
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
