<template>
  <LytProject :active="`project/${pid}/auth`">
    <div class="space-y-5">
      <div class="flex justify-between mb-2.5">
        <p class="mb-0 text-lg font-bold">
          <audit-outlined />
          &nbsp;权限系统
        </p>
        <a-button v-if="!bindMdl" type="primary" @click="onAuthShow(true)">
          <template #icon><unlock-outlined /></template>
          绑定
        </a-button>
        <a-button v-else @click="onAuthShow(true)">
          <template #icon><lock-outlined /></template>
          已绑定
        </a-button>
      </div>
      <EditableTable
        title="角色"
        size="small"
        :api="roleAPI"
        :columns="roleColumns"
        :mapper="roleMapper"
        :copy="Role.copy"
        :emitter="roleEmitter"
        :filter="(record: any) => showGuest || record.name !== 'guest'"
        :disable="(record: any) => record.name === 'guest'"
        :addable="auth.model !== ''"
        @save="refresh"
        @delete="refresh"
        https
      >
        <template #nameHD="{ column }">
          {{ column.title }}
          （
          <a-checkbox v-model:checked="showGuest">
            <a-typography-text type="secondary">显示访客角色</a-typography-text>
          </a-checkbox>
          ）
        </template>
        <template #expandedRowRender="{ record: role }">
          <EditableTable
            title="权限"
            size="small"
            :api="genRuleAPI(role.key)"
            :columns="ruleColumns"
            :mapper="ruleMapper"
            :copy="Rule.copy"
            :emitter="ruleEmitter"
            @add="onRuleEdit"
            @save="refresh"
            @delete="refresh"
          >
            <template #path="{ record }">/{{ pjtName }}{{ record.path }}</template>
            <template #pathEDT="{ editing, mapper }">
              <a-input-group compact>
                <a-form-item-rest>
                  <a-input :value="`/ ${pjtName}`" class="w-1/5 text-right" disabled />
                </a-form-item-rest>
                <a-cascader
                  :options="mapper.options"
                  :value="editing.path.split('/')"
                  class="w-4/5"
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
      <EditableTable
        title="接口"
        size="small"
        :api="{
          all: () => project.services
        }"
        :columns="apiColumn"
        :mapper="apiMapper"
        :copy="API.copy"
        :emitter="apiEmitter"
        :addable="false"
        :editable="false"
        :delable="false"
      >
        <template #path="{ record }">/{{ pjtName }}{{ record.path }}</template>
        <template #sign="{ record }">
          <a-button
            v-if="record.name === 'auth' && record.func === 'sign'"
            size="small"
            :type="!record.flow ? 'primary' : 'default'"
            @click.stop="onSignShow(true)"
          >
            <template #icon><AuditOutlined /></template>
            签发配置
          </a-button>
        </template>
      </EditableTable>
    </div>
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
    <FormDialog
      title="配置签发逻辑"
      :show="showSgn"
      :copy="Sign.copy"
      :mapper="signMapper"
      :emitter="signEmitter"
      @update:show="onSignShow"
      @submit="onSignCfg"
    />
  </LytProject>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import LytProject from '@/layouts/LytProject.vue'
import { methods } from '@/types'
import API from '@/types/api'
import Auth from '@/types/auth'
import Sign from '@/types/cfgSign'
import Role from '@/types/role'
import Rule from '@/types/rule'
import { setProp } from '@/utils'
import { AuditOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons-vue'
import { cloneDeep } from 'lodash'
import { computed, defineComponent, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { authAPI as api, apiAPI, genRuleAPI, roleAPI } from '../apis'
import {
  apiColumn,
  apiEmitter,
  apiMapper,
  authVsb,
  emitter,
  mapper,
  onAuthShow,
  recuAPIs,
  refresh,
  roleColumns,
  roleEmitter,
  roleMapper,
  ruleColumns,
  ruleEmitter,
  ruleMapper,
  signEmitter,
  signMapper
} from './Auth'

export default defineComponent({
  name: 'Authorization',
  components: {
    LytProject,
    AuditOutlined,
    UnlockOutlined,
    LockOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const project = computed(() => store.getters['project/ins'])
    const auth = computed(() => store.getters['project/ins'].auth)
    const pjtName = computed(() => store.getters['project/ins'].name)
    const bindMdl = computed(() => store.getters['project/ins'].auth.model)
    const showSgn = ref(false)
    const showGuest = ref(false)

    onMounted(refresh)
    watch(
      () => showGuest.value,
      () => roleEmitter.emit('refresh')
    )

    function onPathChange(edtAPI: API, val: string[]) {
      edtAPI.path = `/${val.join('/')}`
      const ret = Array.from(
        new Set<string>(
          store.getters['project/apis']
            .filter((api: API) => api.path.startsWith(edtAPI.path))
            .map((api: API) => api.method)
        )
      )
      if (!ret.includes(edtAPI.method)) {
        edtAPI.method = ret[0]
      }
      ruleEmitter.emit('update:mprop', {
        method: {
          label: '访问方式',
          type: 'Select',
          options: ['ALL'].concat(ret).map((mthd: string) => ({ label: mthd, value: mthd }))
        }
      })
    }
    async function onBindModel(form: any) {
      await api.bind(form)
      await refresh()
      authVsb.value = false
    }
    function onSignShow(show: boolean) {
      if (show) {
        signEmitter.emit('update:data', {
          cmpProps: store.getters['project/auth'].props
        })
      }
      showSgn.value = show
    }
    async function onSignCfg(form: any) {
      await api.sign.gen(form.cmpProps)
      await refresh()
      showSgn.value = false
    }
    function onRuleEdit() {
      const ret = {} as Record<string, any>
      for (const api of store.getters['project/apis']) {
        let obj = ret
        for (const ptPath of api.path.split('/').filter((str: string) => str)) {
          if (!(ptPath in obj)) {
            obj[ptPath] = {} as Record<string, any>
          }
          obj = obj[ptPath]
        }
      }
      ruleEmitter.emit('update:mprop', {
        'path.options': recuAPIs(ret)
      })
    }
    return {
      Auth,
      Role,
      Rule,
      API,
      Sign,

      pid,
      api,
      auth,
      mapper,
      emitter,
      project,
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
      showGuest,

      refresh,
      onPathChange,
      genRuleAPI,
      onAuthShow,
      onBindModel,
      onSignShow,
      onSignCfg,
      onRuleEdit
    }
  }
})
</script>
