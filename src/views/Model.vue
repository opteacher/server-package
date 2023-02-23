<template>
  <LytProject :active="`project/${pid}/model/${mid}`">
    <div class="h-full space-y-6">
      <div class="flex justify-between">
        <p class="mb-0 text-xl font-bold">
          <appstore-outlined />
          &nbsp;{{ model.name }}
          <span v-if="model.label">&nbsp;({{ model.label }})</span>
        </p>
        <a-space>
          <a-tooltip>
            <template #title>需要所在项目启动后才可以查看数据集！</template>
            <a-button
              :disabled="pstatus !== 'running'"
              @click.stop="router.push(`/server-package/project/${pid}/dataset/${model.key}`)"
            >
              <template #icon><DatabaseOutlined /></template>
              &nbsp;浏览数据
            </a-button>
          </a-tooltip>
          <a-button
            @click.stop="
              () => {
                expCls.update(model)
                showExpCls = true
              }
            "
          >
            <template #icon><ExportOutlined /></template>
            &nbsp;导出类
          </a-button>
          <FormDialog
            title="导出类"
            v-model:show="showExpCls"
            :object="expCls"
            :copy="ExpCls.copy"
            :mapper="expMapper"
            @submit="(formData: any) => mdlAPI.export(formData)"
          />
          <a-button
            type="primary"
            @click="router.push(`/server-package/project/${pid}/model/${model.key}/form`)"
          >
            <template #icon><FormOutlined /></template>
            &nbsp;表单/表项设计
          </a-button>
        </a-space>
      </div>
      <EditableTable
        title="字段"
        size="small"
        :api="propAPI"
        :columns="propColumns"
        :mapper="propMapper"
        :copy="Property.copy"
        :emitter="propEmitter"
        @save="refresh"
        @delete="refresh"
      >
        <template #relative="{ record }">
          <partition-outlined
            v-if="record.relative.isArray"
            :rotate="record.relative.belong ? 180 : 0"
          />
          {{ record.relative.model }}
        </template>
        <template #relativeEDT="{ editing }">
          <a-input-group>
            <a-row :gutter="8" type="flex" justify="space-around" align="middle">
              <a-col :span="4">
                <a-form-item class="mb-0" ref="relative.belong" name="relative.belong">
                  <a-select
                    class="w-full"
                    :disabled="mdlOpns.length === 1"
                    :value="editing.relative.belong ? 'belong' : 'has'"
                    @change="(val: string) => { editing.relative.belong = val === 'belong' }"
                  >
                    <a-select-option value="belong">属于</a-select-option>
                    <a-select-option value="has">拥有</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="4" class="text-center">
                <a-form-item class="mb-0" ref="relative.isArray" name="relative.isArray">
                  <a-checkbox
                    :disabled="mdlOpns.length === 1"
                    v-model:checked="editing.relative.isArray"
                    @change="(checked: boolean) => { editing.ptype = checked ? 'Array' : 'Id' }"
                  >
                    {{ editing.relative.isArray ? '多个' : '一个' }}
                  </a-checkbox>
                </a-form-item>
              </a-col>
              <a-col :span="16">
                <a-form-item class="mb-0" ref="relative.model" name="relative.model">
                  <a-select
                    class="w-full"
                    :disabled="mdlOpns.length === 1"
                    v-model:value="editing.relative.model"
                    :options="mdlOpns"
                    @change="(relMdl: string) => onRelMdlChange(editing, relMdl)"
                  />
                </a-form-item>
              </a-col>
            </a-row>
          </a-input-group>
        </template>
      </EditableTable>
      <SvcTable :mapper="svcMapper" :columns="svcColumns" :emitter="svcEmitter" />
    </div>
  </LytProject>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import LytProject from '../layouts/LytProject.vue'
import { expMapper, propColumns, propMapper, propEmitter } from './Model'
import ExpCls from '@/types/expCls'
import Property from '@/types/property'
import Service, { emitMapper } from '@/types/service'
import {
  DatabaseOutlined,
  ExportOutlined,
  FormOutlined,
  AppstoreOutlined,
  PartitionOutlined
} from '@ant-design/icons-vue'
import { mdlAPI, propAPI, svcAPI } from '../apis'
import Model from '@/types/model'
import { Stat } from '@/types/status'
import { OpnType } from '@/types'
import { svcColumns, svcEmitter, svcMapper } from './Project'

export default defineComponent({
  name: 'Model',
  components: {
    LytProject,
    DatabaseOutlined,
    ExportOutlined,
    FormOutlined,
    AppstoreOutlined,
    PartitionOutlined
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const pid = route.params.pid as string
    const mid = route.params.mid as string
    const model = computed<Model>(() => store.getters['model/ins'])
    const mdlOpns = computed<OpnType[]>(() =>
      [{ label: '无', value: '' }].concat(
        store.getters['project/models'].map((mdl: Model) => ({
          label: mdl.label || mdl.name,
          value: mdl.name
        }))
      )
    )
    const pjtName = computed<string>(() => store.getters['project/ins'].name)
    const pstatus = computed<Stat>(() => store.getters['project/ins'].status.stat)
    const showExpCls = ref(false)
    const expCls = reactive(new ExpCls())

    onMounted(refresh)

    async function refresh() {
      await store.dispatch('model/refresh')
      propEmitter.emit('refresh', model.value.props)
      svcEmitter.emit(
        'refresh',
        store.getters['project/ins'].service.find((svc: Service) => svc.model === model.value.name)
      )
    }
    function onRelMdlChange(prop: Property, mname: string) {
      if (!mname) {
        return prop.reset()
      }
      const model = store.getters['project/models'].find((mdl: Model) => mdl.name === mname)
      prop.name = model.name + 's'
      prop.label = model.label || ''
      prop.ptype = 'Id'
      prop.index = false
      prop.unique = false
      prop.visible = true
    }
    return {
      ExpCls,
      Property,
      Service,

      store,
      router,
      pid,
      mid,
      model,
      mdlOpns,
      pjtName,
      mdlAPI,
      pstatus,
      expMapper,
      showExpCls,
      expCls,
      propAPI,
      propColumns,
      propMapper,
      propEmitter,
      svcAPI,
      svcMapper,
      svcColumns,
      svcEmitter,
      emitMapper,

      refresh,
      onRelMdlChange
    }
  }
})
</script>
