<template>
  <LytProject :active="`/project/${pid}/auth/audit`">
    <a-page-header title="权限系统" sub-title="【角色】1-N【接口】" class="px-0">
      <template #extra>
        <a v-if="!bindMdl" :href="`/server-package/project/${pid}`">未定义账户模型，前往新增</a>
        <a-button v-if="!bindMdl" @click="onAuthShow(true)">
          <template #icon><unlock-outlined /></template>
          绑定
        </a-button>
        <a-button v-else type="primary" @click="onAuthShow(true)">
          <template #icon><lock-outlined /></template>
          已绑定
        </a-button>
      </template>
    </a-page-header>
    <EditableTable
      title="角色"
      description="展示所有角色和可访问的接口"
      size="small"
      :api="roleAPI"
      :columns="roleColumns"
      :mapper="roleMapper"
      :new-fun="() => newOne(Role)"
      :emitter="roleEmitter"
      :filter="(record: any) => showGuest || record.name !== 'guest'"
      :disable="(record: any) => record.name === 'guest'"
      :addable="auth.model !== ''"
      @save="refresh"
      @delete="refresh"
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
          :new-fun="() => newOne(Rule)"
          :emitter="ruleEmitter"
          @add="onRuleEdit"
          @save="refresh"
          @delete="refresh"
        >
          <template #path="{ record }">/{{ pjtName }}{{ record.path }}</template>
          <template #pathEDT="{ editing, mapper }">
            <a-input-group compact>
              <a-form-item-rest>
                <a-button
                  class="w-2/5"
                  @click="
                    () => {
                      selMode = !selMode
                    }
                  "
                >
                  /{{ pjtName }}【{{ selMode ? '选择路由' : '自定义路由' }}】
                </a-button>
              </a-form-item-rest>
              <a-cascader
                v-if="selMode"
                :options="mapper.options"
                :value="editing.path.split('/')"
                class="w-3/5"
                expand-trigger="hover"
                change-on-select
                :allow-clear="true"
                @change="(val: any) => onPathChange(editing, val)"
              />
              <a-input v-else class="w-3/5" v-model:value="editing.path" />
            </a-input-group>
          </template>
        </EditableTable>
      </template>
    </EditableTable>
    <FormDialog
      title="绑定账户模型"
      :visible="authVsb"
      :new-fun="() => newOne(Auth)"
      :mapper="mapper"
      :emitter="emitter"
      :object="auth"
      @update:visible="onAuthShow"
      @submit="onBindModel"
    />
  </LytProject>
</template>

<script lang="ts" setup name="Authorization">
/* eslint-disable @typescript-eslint/no-explicit-any */
import LytProject from '@/layouts/LytProject.vue'
import API from '@/types/api'
import Auth from '@/types/auth'
import Project from '@/types/project'
import Role from '@/types/role'
import Rule from '@/types/rule'
import { Method } from '@/types/service'
import { newOne } from '@/utils'
import { LockOutlined, UnlockOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { authAPI as api, genRuleAPI, roleAPI } from '../apis'
import {
  authVsb,
  emitter,
  mapper,
  onAuthShow,
  pickPKeyFmPath,
  refresh,
  roleColumns,
  roleEmitter,
  roleMapper,
  ruleColumns,
  ruleEmitter,
  ruleMapper
} from './Auth'

const store = useStore()
const route = useRoute()
const pid = route.params.pid
const auth = computed(() => store.getters['project/ins'].auth)
const pjtName = computed(() => store.getters['project/ins'].name)
const bindMdl = computed(() => store.getters['project/ins'].auth.model)
const showGuest = ref(false)
const selMode = ref(true)

onMounted(refresh)
watch(
  () => showGuest.value,
  () => roleEmitter.emit('refresh')
)

function onPathChange(rule: Rule, val: string[]) {
  rule.path = `/${val.join('/')}`
  const ret = Array.from(
    new Set<string>(
      store.getters['project/apis']
        .filter((api: API) => api.path.startsWith(rule.path))
        .map((api: API) => api.method)
    )
  )
  if (!ret.includes(rule.method)) {
    rule.method = ret[0] as Method
  }
  ruleEmitter.emit('update:mprop', {
    method: {
      label: '访问方式',
      type: 'Select',
      options: ['ALL'].concat(ret).map((mthd: string) => ({ label: mthd, value: mthd }))
    }
  })
  if (rule.value === ':i') {
    updIdenMdls(rule)
    pickPKeyFmPath(rule)
  }
}
async function onBindModel(form: any) {
  await api.bind(form)
  await refresh()
  authVsb.value = false
}
function onRuleEdit(editing?: Rule) {
  const project = store.getters['project/ins'] as Project
  ruleEmitter.emit('update:mprop', {
    'idens.mapper.pVal.disabled': project.status.stat !== 'running'
  })
  if (editing && editing.path) {
    updIdenMdls(editing)
    pickPKeyFmPath(editing)
  }

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
function updIdenMdls(rule: Rule) {
  const project = store.getters['project/ins'] as Project
  ruleEmitter.emit('update:mprop', {
    'idens.mapper.model.options': project.models
      .filter(model => rule.path.includes(`/${model.name}`))
      .map(model => ({
        label: model.label,
        value: model.key
      }))
  })
}
</script>
