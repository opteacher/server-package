<template>
  <LytAuth>
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
        />
      </template>
    </EditableTable>
  </LytAuth>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import LytAuth from '../layouts/LytAuth.vue'
import EditableTable from '../components/com/EditableTable.vue'
import { Auth, Role } from '@/common'
import { AuthColumns, authEmitter, AuthMapper, RoleColumns, roleEmitter, RoleMapper } from './Auth'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'Authorization',
  components: {
    LytAuth,
    EditableTable
  },
  setup() {
    const store = useStore()

    async function onRoleSave(role: Role, refresh: () => void) {
      await store.dispatch('auth/saveRole', role)
      await store.dispatch('project/refresh')
      refresh()
    }
    async function onRoleDel(key: string, refresh: () => void) {
      await store.dispatch('auth/delRole', key)
      await store.dispatch('project/refresh')
      refresh()
    }
    async function onAuthSave(auth: Auth, rid: string, refresh: () => void) {}
    async function onAuthDel(aid: string, rid: string, refresh: () => void) {}
    return {
      Role,
      Auth,

      RoleColumns,
      RoleMapper,
      roleEmitter,
      AuthColumns,
      AuthMapper,
      authEmitter,

      onRoleSave,
      onRoleDel,
      onAuthSave,
      onAuthDel
    }
  }
})
</script>
