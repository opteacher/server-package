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
      <EditableTable
        title="服务"
        size="small"
        :api="svcAPI"
        :mapper="svcMapper"
        :columns="svcColumns"
        :copy="Service.copy"
        :emitter="svcEmitter"
        @add="onAddSvcClicked"
        @before-save="onBefSave"
        @save="refresh"
        @delete="refresh"
      >
        <template #emit="{ record: svc }">
          {{ emitMapper[svc.emit as EmitType] }}
        </template>
        <template #pathCond="{ record: svc }">
          <template v-if="svc.emit === 'api'">
            {{ svc.path }}
          </template>
          <template v-else-if="svc.emit === 'timeout'">{{ svc.condition }}后</template>
          <template v-else-if="svc.emit === 'interval'">每{{ svc.condition }}</template>
          <template v-else>-</template>
        </template>
        <template #fileFunc="{ record: svc }">
          <template v-if="!svc.isModel">{{ svc.name }}.{{ svc.interface }}()</template>
          <template v-else>-</template>
        </template>
        <template #flow="{ record: svc }">
          <a-button
            v-if="!svc.isModel"
            type="primary"
            size="small"
            @click.stop="
              $router.push(`/server-package/project/${pid}/model/${mid}/flow/${svc.key}`)
            "
          >
            <template #icon><edit-outlined /></template>
            &nbsp;设计流程
          </a-button>
          <template v-else>
            <InfoCircleOutlined />
            模型路由流程固定
          </template>
        </template>
        <template #methodCtrl="{ record: svc }">
          <template v-if="svc.emit === 'api'">
            {{ svc.method }}
          </template>
          <template v-else-if="svc.emit === 'timeout' || svc.emit === 'interval'">
            <a-space align="center">
              <a-tooltip>
                <template #title>需先启动项目后才能启动任务！</template>
                <a-button
                  class="mb-3"
                  size="small"
                  type="primary"
                  :disabled="pstatus !== 'running'"
                  @click.stop="() => svcAPI.job.restart(svc.key)"
                >
                  启动
                </a-button>
              </a-tooltip>
              <a-button
                v-if="svc.jobId"
                size="small"
                danger
                :disabled="pstatus !== 'running'"
                @click.stop="() => svcAPI.job.stop(svc.key)"
              >
                停止
              </a-button>
            </a-space>
          </template>
          <template v-else>-</template>
        </template>
        <template #desc="{ record: svc }">
          <a-tooltip v-if="svc.desc">
            <template #title>{{ svc.desc }}</template>
            <a-button type="link" size="small" click.stop="e => e.preventDefault()">
              <template #icon><info-circle-outlined /></template>
            </a-button>
          </a-tooltip>
          <template v-else>-</template>
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
import {
  expMapper,
  propColumns,
  propMapper,
  propEmitter,
  svcEmitter,
  svcMapper,
  svcColumns
} from './Model'
import ExpCls from '@/types/expCls'
import Property from '@/types/property'
import Service, { emitMapper, EmitType } from '@/types/service'
import {
  DatabaseOutlined,
  ExportOutlined,
  FormOutlined,
  AppstoreOutlined,
  PartitionOutlined,
  EditOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import { mdlAPI, propAPI, svcAPI } from '../apis'
import Model from '@/types/model'

console.log(svcMapper)

export default defineComponent({
  name: 'Model',
  components: {
    LytProject,
    DatabaseOutlined,
    ExportOutlined,
    FormOutlined,
    AppstoreOutlined,
    PartitionOutlined,
    EditOutlined,
    InfoCircleOutlined
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const pid = route.params.pid as string
    const mid = route.params.mid as string
    const model = computed(() => store.getters['model/ins'])
    const mname = computed(() => store.getters['model/ins'].name)
    const mdlOpns = computed(() =>
      [{ label: '无', value: '' }].concat(
        store.getters['project/models'].map((mdl: Model) => ({
          label: mdl.label || mdl.name,
          value: mdl.name
        }))
      )
    )
    const pjtName = computed(() => store.getters['project/ins'].name)
    const pstatus = computed(() => store.getters['project/ins'].status.stat)
    const showExpCls = ref(false)
    const expCls = reactive(new ExpCls())

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
    function onAddSvcClicked() {
      svcEmitter.emit('update:data', { name: mname.value })
    }
    function onBefSave(svc: Service) {
      if (svc.emit === 'timeout' || svc.emit === 'interval') {
        svc.path = `/job/v1/${mname.value}/${svc.interface}`
      }
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
      svcColumns,
      svcEmitter,
      svcMapper,
      emitMapper,

      refresh,
      onRelMdlChange,
      onAddSvcClicked,
      onBefSave
    }
  }
})
</script>
