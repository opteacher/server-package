<template>
  <LytProject :active="`project/${pid}/auth`">
    <a-row class="mb-10">
      <a-col :span="12">
        <p style="margin-bottom: 0; font-size: 15pt; font-weight: bold">
          <audit-outlined />
          &nbsp;权限系统
        </p>
      </a-col>
      <a-col class="text-right" :span="12">
        <a-button v-if="!bindMdl" type="primary" @click="onAuthShow(true)">
          <template #icon><unlock-outlined /></template>
          绑定
        </a-button>
        <a-button v-else @click="onAuthShow(true)">
          <template #icon><lock-outlined /></template>
          已绑定
        </a-button>
      </a-col>
    </a-row>
    <FormDialog
      title="配置"
      :show="authVsb"
      :copy="Auth.copy"
      :mapper="mapper"
      :emitter="emitter"
      :object="auth"
      @update:show="onAuthShow"
      @submit="onBindModel"
    />
    <EditableTable
      title="自定义接口"
      size="small"
      :api="apiAPI"
      :columns="apiColumn"
      :mapper="apiMapper"
      :copy="API.copy"
      :emitter="apiEmitter"
      :filter="(record: any) => record.model === '自定义'"
      @add="apiMapper['path'].prefix = `/${pjtName}`"
      @edit="apiMapper['path'].prefix = `/${pjtName}`"
      @save="refresh"
      @delete="refresh"
    >
      <template #path="{ record }">/{{ pjtName }}{{ record.path }}</template>
      <template #roles="{ record }">
        {{ record.roles.length ? record.roles.join(' , ') : '-' }}
      </template>
      <template #sign="{ record }">
        <a-button
          v-if="record.svc === 'auth' && record.path.slice(-'sign'.length) === 'sign'"
          @click="onSignConfig()"
        >
          <template #icon>
            <AuditOutlined />
          </template>
          &nbsp;签发配置
        </a-button>
      </template>
    </EditableTable>
    <FormDialog
      title="配置签发逻辑"
      :show="showSgn"
      :copy="SgnProp.copy"
      :mapper="signMapper"
      :emitter="signEmitter"
      @update:show="show => (showSgn = show)"
      @submit="
        () => {
          /* 保存签发逻辑 */
        }
      "
    />
    <div class="mt-20">
      <EditableTable
        title="角色"
        size="small"
        :api="roleAPI"
        :columns="roleColumns"
        :mapper="roleMapper"
        :copy="Role.copy"
        :emitter="roleEmitter"
        :filter="(record: any) => record.name !== 'guest'"
        :disabled="auth.model === ''"
        @save="refresh"
        @delete="refresh"
      >
        <template #expandedRowRender="{ record: role }">
          <EditableTable
            title="权限"
            size="small"
            :api="genRuleAPI(role.key)"
            :columns="ruleColumns"
            :mapper="ruleMapper"
            :copy="Rule.copy"
            :emitter="ruleEmitter"
            @save="refresh"
            @delete="refresh"
          >
            <template #methodEdit="{ editing }">
              <a-select
                class="w-100"
                v-model:value="editing.method"
                :options="
                  methods
                    .map(mthd => ({ label: mthd, value: mthd }))
                    .concat({ label: '*', value: '*' })
                "
              />
            </template>
            <template #path="{ record }">/{{ pjtName }}{{ record.path }}</template>
            <template #pathEdit="{ editing }">
              <a-input-group compact>
                <a-input :value="`/ ${pjtName}`" style="width: 20%; text-align: right" disabled />
                <a-cascader
                  :options="apiAPI.all()"
                  :value="editing.path.split('/')"
                  style="width: 80%"
                  expand-trigger="hover"
                  change-on-select
                  :allow-clear="true"
                  @change="(val: any) => onPathChange(editing, val)"
                />
              </a-input-group>
            </template>
          </EditableTable>
        </template>
      </EditableTable>
    </div>
  </LytProject>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, computed, ref, onMounted } from 'vue'
import FormDialog from '../components/com/FormDialog.vue'
import EditableTable from '../components/com/EditableTable.vue'
import {
  apiColumn,
  apiMapper,
  ruleColumns,
  ruleEmitter,
  ruleMapper,
  apiEmitter,
  roleColumns,
  roleEmitter,
  roleMapper,
  mapper,
  emitter,
  onAuthShow,
  signMapper,
  signEmitter,
  authVsb,
  refresh
} from './Auth'
import { useStore } from 'vuex'
import { AuditOutlined, UnlockOutlined, LockOutlined } from '@ant-design/icons-vue'
import API from '@/types/api'
import Role from '@/types/role'
import Rule from '@/types/rule'
import { methods } from '@/types'
import Auth from '@/types/auth'
import LytProject from '@/layouts/LytProject.vue'
import { useRoute } from 'vue-router'
import { authAPI as api, apiAPI, roleAPI, genRuleAPI } from '../apis'
import SgnProp from '@/types/sgnProp'

export default defineComponent({
  name: 'Authorization',
  components: {
    EditableTable,
    FormDialog,
    LytProject,
    AuditOutlined,
    UnlockOutlined,
    LockOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const auth = computed(() => store.getters['project/ins'].auth)
    const pjtName = computed(() => store.getters['project/ins'].name)
    const bindMdl = computed(() => store.getters['project/ins'].auth.model)
    const showSgn = ref(false)

    onMounted(refresh)

    function onPathChange(edtAPI: API, val: string[]) {
      edtAPI.path = `/${val.join('/')}`
      const ret = Array.from(
        new Set<string>(
          store.getters['auth/apis']
            .filter((api: API) => api.path.startsWith(edtAPI.path))
            .map((api: API) => api.method)
        )
      )
      if (!ret.includes(edtAPI.method)) {
        edtAPI.method = ret[0]
      }
      ruleEmitter.emit('update:mapper', {
        method: {
          type: 'Select',
          options: ret.map((mthd: string) => ({ label: mthd, value: mthd }))
        }
      })
    }
    async function onBindModel(form: any) {
      await api.save(form)
      await refresh()
      authVsb.value = false
    }
    function onSignConfig() {
      showSgn.value = true
      signMapper.cmpProps = auth.value.props
      signEmitter.emit('update:data', signMapper)
    }
    return {
      Auth,
      Role,
      Rule,
      API,
      SgnProp,

      pid,
      api,
      auth,
      mapper,
      emitter,
      pjtName,
      bindMdl,
      apiAPI,
      roleAPI,
      methods,
      roleColumns,
      roleMapper,
      roleEmitter,
      ruleColumns,
      ruleMapper,
      ruleEmitter,
      apiColumn,
      apiMapper,
      apiEmitter,
      authVsb,
      showSgn,
      signMapper,
      signEmitter,

      refresh,
      onPathChange,
      onSignConfig,
      genRuleAPI,
      onAuthShow,
      onBindModel
    }
  }
})
</script>
