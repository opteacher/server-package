<template>
  <LytAuth>
    <EditableTable
      title="自定义接口"
      dsKey="project/ins.apis"
      :columns="ApiColumn"
      :mapper="ApiMapper"
      :copy="copyApi"
      :emitter="apiEmitter"
      :filter="(record: any, opera: 'edit' | 'delete') => {
        return record.model === '自定义'
      }"
      @add="ApiMapper['path'].prefix = `/${pjtName}`"
    >
      <template #path="{ record: api }">/{{ pjtName }}{{ api.path }}</template>
    </EditableTable>
    <EditableTable
      title="角色"
      dsKey="project/ins.roles"
      :columns="RoleColumns"
      :mapper="RoleMapper"
      :copy="Role.copy"
      :emitter="roleEmitter"
      @save="onRoleSave"
      @delete="onRoleDel"
    >
      <template #expandedRowRender="{ record: role }">
        <EditableTable
          title="权限"
          :dsKey="`project/ins.roles.[${role.key}].auths`"
          :columns="AuthColumns"
          :mapper="AuthMapper"
          :copy="Auth.copy"
          :emitter="authEmitter"
          @save="(auth, refresh) => onAuthSave(auth, role.key, refresh)"
          @delete="(key, refresh) => onAuthDel(key, role.key, refresh)"
        >
          <template #methodEdit="{ editing: api }">
            <a-select
              class="w-100"
              v-model:value="api.method"
              :options="routeMethods.map((mthd: string) => ({ label: mthd, value: mthd }))"
            />
          </template>
          <template #pathEdit="{ editing: api }">
            <a-input-group compact>
              <a-input :value="`/ ${pjtName}`" style="width: 20%; text-align: right" disabled />
              <a-cascader
                :options="allAPIs"
                :value="api.path.split('/')"
                style="width: 80%"
                expand-trigger="hover"
                change-on-select
                :allow-clear="false"
                @change="(val: any) => onPathChange(api, val)"
              />
            </a-input-group>
          </template>
        </EditableTable>
      </template>
    </EditableTable>
    <EditableTable
      description="该表中的每条记录都会绑定一个角色，用于鉴权"
      dsKey=""
      :columns="[]"
      :mapper="DataSetMapper"
      :addable="false"
    >
      <template #emptyText>
        <a-empty
          image="https://gw.alipayobjects.com/mdn/miniapp_social/afts/img/A*pevERLJC9v0AAAAAAAAAAABjAQAAAQ/original"
          :image-style="{
            height: '60px'
          }"
        >
          <template #description>
            <span>无数据</span>
          </template>
          <a-button type="primary">绑定模型</a-button>
        </a-empty>
      </template>
    </EditableTable>
  </LytAuth>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue'
import LytAuth from '../layouts/LytAuth.vue'
import EditableTable from '../components/com/EditableTable.vue'
import { API, Auth, Role, routeMethods, StrIterable } from '@/common'
import {
  ApiColumn,
  ApiMapper,
  AuthColumns,
  authEmitter,
  AuthMapper,
  copyApi,
  apiEmitter,
  RoleColumns,
  roleEmitter,
  RoleMapper,
  DataSetMapper
} from './Auth'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Authorization',
  components: {
    LytAuth,
    EditableTable
  },
  setup() {
    const store = useStore()
    const pjtName = computed(() => store.getters['project/ins'].name)
    const allAPIs = computed(() => {
      const ret = {} as StrIterable
      for (const api of store.getters['project/ins'].apis) {
        let obj = ret
        for (const ptPath of api.path.split('/').filter((str: string) => str)) {
          if (!(ptPath in obj)) {
            obj[ptPath] = {} as StrIterable
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
    async function onRoleSave(role: Role, refresh: () => void) {
      await store.dispatch('auth/saveRole', role)
      refresh()
    }
    async function onRoleDel(key: string, refresh: () => void) {
      await store.dispatch('auth/delRole', key)
      refresh()
    }
    async function onAuthSave(auth: Auth, rid: string, refresh: () => void) {
      await store.dispatch('auth/saveAuth', { auth, rid })
      refresh()
    }
    async function onAuthDel(aid: string, rid: string, refresh: () => void) {
      await store.dispatch('auth/delAuth', { aid, rid })
      refresh()
    }
    function onPathChange(edtAPI: API, val: string[]) {
      edtAPI.path = `/${val.join('/')}`
      const ret = Array.from(
        new Set<string>(
          store.getters['project/ins'].apis
            .filter((api: API) => api.path.startsWith(edtAPI.path))
            .map((api: API) => api.method)
        )
      )
      if (!ret.includes(edtAPI.method)) {
        edtAPI.method = ret[0]
      }
      console.log(ret)
      authEmitter.emit('update:mapper', {
        method: {
          type: 'Select',
          options: ret.map((mthd: string) => ({ label: mthd, value: mthd }))
        }
      })
    }
    return {
      Role,
      Auth,

      pjtName,
      allAPIs,
      routeMethods,
      RoleColumns,
      RoleMapper,
      roleEmitter,
      AuthColumns,
      AuthMapper,
      authEmitter,
      ApiColumn,
      ApiMapper,
      apiEmitter,
      DataSetMapper,

      copyApi,
      onRoleSave,
      onRoleDel,
      onAuthSave,
      onAuthDel,
      onPathChange
    }
  }
})
</script>
