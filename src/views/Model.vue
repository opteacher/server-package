<template>
  <LytProject :active="`project/${pid}/model/${mid}`">
    <a-row class="mb-5">
      <a-col :span="12">
        <p style="font-size: 15pt; font-weight: bold; margin-bottom: 0">
          <appstore-outlined />
          &nbsp;{{ model.name }}
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
            :show="showExpCls"
            :object="expCls"
            :copy="ExpCls.copy"
            :mapper="expMapper"
            @update:show="
              show => {
                showExpCls = show
              }
            "
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
      />
    </div>
    <div class="mt-24">
      <EditableTable
        title="服务"
        size="small"
        :api="svcAPI"
        :columns="svcColumns"
        :copy="Service.copy"
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
          <template v-if="svc.emit === 'api'">
            {{ svc.path }}
          </template>
          <template v-else-if="svc.emit === 'timeout'">
            {{ `${svc.condition}后` }}
          </template>
          <template v-else-if="svc.emit === 'interval'">
            {{ `每${svc.condition}` }}
          </template>
        </template>
        <template #detail>
          <a-button size="small">具体信息</a-button>
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
  AppstoreOutlined
} from '@ant-design/icons-vue'
import { propColumns, propMapper, svcColumns } from './Model'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { mdlAPI, propAPI, svcAPI } from '../apis'

export default defineComponent({
  name: 'Model',
  components: {
    LytProject,
    EditableTable,
    FormDialog,
    DatabaseOutlined,
    ExportOutlined,
    FormOutlined,
    AppstoreOutlined
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const store = useStore()
    const pid = route.params.pid as string
    const mid = route.params.mid as string
    const model = computed(() => store.getters['model/ins'])
    const pstatus = computed(() => store.getters['project/ins'].status)
    const showExpCls = ref(false)
    const expCls = reactive(new ExpCls())
    const propEmitter = new Emitter()

    onMounted(refresh)

    async function refresh() {
      await store.dispatch('model/refresh')
      propEmitter.emit('refresh', model.value.props)
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

      refresh
    }
  }
})
</script>
