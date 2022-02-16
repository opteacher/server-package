<template>
  <LytAuth>
    <EditableTable
      title="自定义接口"
      dsKey="auth/apis"
      :columns="apiColumn"
      :mapper="apiMapper"
      :copy="API.copy"
      :emitter="apiEmitter"
      :filter="record => record.model === '自定义'"
      @add="apiMapper['path'].prefix = `/${pjtName}`"
      @edit="apiMapper['path'].prefix = `/${pjtName}`"
      @save="(api, refresh) => onApiSave(api, refresh)"
      @delete="(key, refresh) => onApiDel(key, refresh)"
    >
      <template #path="{ record: api }">/{{ pjtName }}{{ api.path }}</template>
      <template #roles="{ record: api }">
        {{ api.roles.length ? api.roles.join(' , ') : '-' }}
      </template>
      <template #sign="{ record: api }">
        <a-button
          v-if="api.svc === 'auth' && api.path.slice(-'sign'.length) === 'sign'"
          @click="onSignConfig(api)"
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
      :show="configSign.show"
      :copy="ConfigSign.copy"
      :mapper="ConfigSign.mapper"
      :emitter="ConfigSign.emitter"
      @update:show="show => (configSign.show = show)"
      @submit="ConfigSign.onSave"
    />
    <EditableTable
      title="角色"
      dsKey="auth/ins.roles"
      :columns="roleColumns"
      :mapper="roleMapper"
      :copy="Role.copy"
      :emitter="roleEmitter"
      :filter="record => record.name !== 'guest'"
      @save="onRoleSave"
      @delete="onRoleDel"
    >
      <template #expandedRowRender="{ record: role }">
        <EditableTable
          title="权限"
          :dsKey="`auth/ins.roles.[${role.key}].rules`"
          :columns="ruleColumns"
          :mapper="ruleMapper"
          :copy="Rule.copy"
          :emitter="ruleEmitter"
          @save="(rule, refresh) => onRuleSave(rule, role.key, refresh)"
          @delete="(key, refresh) => onRuleDel(key, role.key, refresh)"
        >
          <template #methodEdit="{ editing: api }">
            <a-select
              class="w-100"
              v-model:value="api.method"
              :options="
                methods
                  .map(mthd => ({ label: mthd, value: mthd }))
                  .concat({ label: '*', value: '*' })
              "
            />
          </template>
          <template #path="{ record: api }">/{{ pjtName }}{{ api.path }}</template>
          <template #pathEdit="{ editing: api }">
            <a-input-group compact>
              <a-input :value="`/ ${pjtName}`" style="width: 20%; text-align: right" disabled />
              <a-cascader
                :options="allAPIs"
                :value="api.path.split('/')"
                style="width: 80%"
                expand-trigger="hover"
                change-on-select
                :allow-clear="true"
                @change="val => onPathChange(api, val)"
              />
            </a-input-group>
          </template>
        </EditableTable>
      </template>
    </EditableTable>
  </LytAuth>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { defineComponent, computed } from 'vue'
import LytAuth from '../layouts/LytAuth.vue'
import FormDialog from '../components/com/FormDialog.vue'
import EditableTable from '../components/com/EditableTable.vue'
import { API, Role, methods, Rule } from '@/common'
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
  ConfigSign,
  configSign
} from './Auth'
import { useStore } from 'vuex'
import { AuditOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'Authorization',
  components: {
    LytAuth,
    EditableTable,
    FormDialog,

    AuditOutlined
  },
  setup() {
    const store = useStore()
    const pjtName = computed(() => store.getters['project/ins'].name)
    const allAPIs = computed(() => {
      const ret = {} as Record<string, any>
      for (const api of store.getters['auth/apis']) {
        let obj = ret
        for (const ptPath of api.path.split('/').filter((str: string) => str)) {
          if (!(ptPath in obj)) {
            obj[ptPath] = {} as Record<string, any>
          }
          obj = obj[ptPath]
        }
      }
      return recuAPIs(ret)
    })

    function recuAPIs(obj: any): any[] {
      const ret = []
      for (const key of Object.keys(obj)) {
        ret.push({
          label: key,
          value: key,
          children: recuAPIs(obj[key])
        })
      }
      return ret
    }
    async function onApiSave(api: API, refresh: () => void) {
      await store.dispatch('auth/saveAPI', api)
      refresh()
    }
    async function onApiDel(key: string, refresh: () => void) {
      await store.dispatch('auth/delAPI', key)
      refresh()
    }
    async function onRoleSave(role: Role, refresh: () => void) {
      await store.dispatch('auth/saveRole', role)
      refresh()
    }
    async function onRoleDel(key: string, refresh: () => void) {
      await store.dispatch('auth/delRole', key)
      refresh()
    }
    async function onRuleSave(rule: Rule, roleId: string, refresh: () => void) {
      // 之前控制了methods，所以在提交权限之前要还原，不然更新之后GET可能不会出现在methods中
      ruleEmitter.emit('update:mapper', {
        method: {
          type: 'Select',
          options: methods
            .map((mthd: string) => ({ label: mthd, value: mthd }))
            .concat({ label: '*', value: '*' })
        }
      })
      await store.dispatch('auth/saveRule', { rule, roleId })
      refresh()
    }
    async function onRuleDel(ruleId: string, roleId: string, refresh: () => void) {
      await store.dispatch('auth/delRule', { ruleId, roleId })
      refresh()
    }
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
    function onSignConfig(api: any) {
      console.log(api)
      configSign.show = true
    }
    return {
      Role,
      Rule,
      API,
      ConfigSign,

      pjtName,
      allAPIs,
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
      configSign,

      onApiSave,
      onApiDel,
      onRoleSave,
      onRoleDel,
      onRuleSave,
      onRuleDel,
      onPathChange,
      onSignConfig
    }
  }
})
</script>
