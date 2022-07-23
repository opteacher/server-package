<template>
  <LytProject :active="`project/${pid}/model/${mid}`">
    <a-row class="mb-5">
      <a-col :span="12">
        <p style="font-size: 15pt; font-weight: bold; margin-bottom: 0">
          <appstore-outlined />
          &nbsp;{{ model.name }}
          <span v-if="model.label">&nbsp;({{ model.label }})</span>
        </p>
      </a-col>
      <a-col :span="12" style="text-align: right">
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
            @submit="formData => mdlAPI.export(formData)"
          />
          <a-button
            type="primary"
            @click="router.push(`/server-package/project/${pid}/model/${model.key}/form`)"
          >
            <template #icon><FormOutlined /></template>
            &nbsp;表单/表项设计
          </a-button>
        </a-space>
      </a-col>
    </a-row>
    <div class="mt-24">
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
                    class="w-100"
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
                  >
                    {{ editing.relative.isArray ? '多个' : '一个' }}
                  </a-checkbox>
                </a-form-item>
              </a-col>
              <a-col :span="16">
                <a-form-item class="mb-0" ref="relative.model" name="relative.model">
                  <a-select
                    class="w-100"
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
    </div>
    <div class="mt-24">
      <EditableTable
        title="服务"
        size="small"
        :api="{ all: () => [] }"
        :columns="svcColumns"
        :copy="Service.copy"
        :emitter="svcEmitter"
        :edtable="false"
        :delable="false"
        @add="$router.push(`/server-package/project/${pid}/model/${mid}/apis`)"
      >
        <template #emit="{ record: svc }">
          <template v-if="svc.emit === 'api'">接口</template>
          <template v-else-if="svc.emit === 'timeout'">延时任务</template>
          <template v-else-if="svc.emit === 'interval'">定时任务</template>
        </template>
        <template #pathCond="{ record: svc }">
          <template v-if="svc.emit === 'api'">/{{ pjtName }}{{ svc.path }}</template>
          <template v-else-if="svc.emit === 'timeout'">
            {{ `${svc.condition}后` }}
          </template>
          <template v-else-if="svc.emit === 'interval'">
            {{ `每${svc.condition}` }}
          </template>
        </template>
        <template #path="{ record: svc }">
          <a
            @click.stop="
              $router.push(
                `/server-package/project/${pid}/model/${mid}/${
                  svc.emit === 'api' ? 'apis' : 'jobs'
                }`
              )
            "
          >
            {{ svc.path }}
          </a>
        </template>
      </EditableTable>
    </div>
  </LytProject>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import LytProject from '../layouts/LytProject.vue'
import EditableTable from '../components/com/EditableTable.vue'
import FormDialog from '../components/com/FormDialog.vue'
import { expMapper } from './Model'
import ExpCls from '@/types/expCls'
import Property from '@/types/property'
import Service from '@/types/service'
import {
  DatabaseOutlined,
  ExportOutlined,
  FormOutlined,
  AppstoreOutlined,
  PartitionOutlined
} from '@ant-design/icons-vue'
import { propColumns, propMapper, svcColumns } from './Model'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { mdlAPI, propAPI } from '../apis'
import Model from '@/types/model'

export default defineComponent({
  name: 'Model',
  components: {
    LytProject,
    EditableTable,
    FormDialog,
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
    const model = computed(() => store.getters['model/ins'])
    const mdlOpns = computed(() =>
      [{ label: '无', value: '' }].concat(
        store.getters['project/models']
          .filter((mdl: Model) => mdl.key !== mid)
          .map((mdl: Model) => ({ label: mdl.label || mdl.name, value: mdl.name }))
      )
    )
    const pjtName = computed(() => store.getters['project/ins'].name)
    const pstatus = computed(() => store.getters['project/ins'].status.stat)
    const showExpCls = ref(false)
    const expCls = reactive(new ExpCls())
    const propEmitter = new Emitter()
    const svcEmitter = new Emitter()

    onMounted(refresh)

    async function refresh() {
      await store.dispatch('model/refresh')
      propEmitter.emit('refresh', model.value.props)
      svcEmitter.emit('refresh', model.value.svcs)
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
      svcColumns,
      svcEmitter,

      refresh,
      onRelMdlChange
    }
  }
})
</script>
