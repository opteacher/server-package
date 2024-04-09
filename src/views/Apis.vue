<template>
  <LytProject :active="`/project/${pid}/auth/apis`">
    <a-page-header title="权限系统" sub-title="【接口】1-N【角色】" class="px-0">
      <template #extra>
        <a-tooltip>
          <template #title>未绑定权限模型，需先在【权限】-【授权】页面绑定模型</template>
          <a-button :disabled="!project.auth.model" @click.stop="onSignShow(true)">
            <template #icon><AuditOutlined /></template>
            签发配置
          </a-button>
        </a-tooltip>
      </template>
    </a-page-header>
    <EditableTable
      title="接口"
      description="展示所有接口和对应可访问的角色"
      size="small"
      :api="{
        all: getAllSvcs
      }"
      :columns="apiColumn"
      :mapper="apiMapper"
      :new-fun="() => newOne(API)"
      :emitter="apiEmitter"
      :addable="false"
      :editable="false"
      :delable="false"
    >
      <template #path="{ record }">/{{ pjtName }}{{ record.path }}</template>
      <template #pathVW="{ current }">/{{ pjtName }}{{ current.path }}</template>
      <template #method="{ record: api }">
        <a-tag :color="mthdClrs[api.method as Method]">{{ api.method }}</a-tag>
      </template>
      <template #roles="{ record: api }">{{ api.roles.join('、') }}</template>
    </EditableTable>
    <FormDialog
      title="配置签发逻辑"
      width="40vw"
      :visible="showSgn"
      :new-fun="() => newOne(Sign)"
      :mapper="signMapper"
      :emitter="signEmitter"
      @update:visible="onSignShow"
      @submit="onSignCfg"
    />
  </LytProject>
</template>

<script setup lang="ts">
import { authAPI, mdlAPI } from '@/apis'
import LytProject from '@/layouts/LytProject.vue'
import API from '@/types/api'
import Sign from '@/types/cfgSign'
import Project from '@/types/project'
import Role from '@/types/role'
import Rule from '@/types/rule'
import Service, { Method, mthdClrs } from '@/types/service'
import { pickOrIgnore } from '@/utils'
import { newOne } from '@/utils'
import { AuditOutlined } from '@ant-design/icons-vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

import { apiColumn, apiEmitter, apiMapper, refresh, signEmitter, signMapper } from './Auth'

const route = useRoute()
const store = useStore()
const pid = route.params.pid
const project = computed<Project>(() => store.getters['project/ins'])
const pjtName = computed<string>(() => store.getters['project/ins'].name)
const showSgn = ref(false)

onMounted(refresh)

async function getAllSvcs() {
  const services = store.getters['project/ins'].services as Service[]
  const models = await Promise.all(
    Array.from(new Set(services.map(svc => svc.model).filter(mid => mid))).map(mid =>
      mdlAPI.detail(mid, { messages: { notShow: true } })
    )
  )
  const mMapper = Object.fromEntries(models.map(mdl => [mdl.key, mdl.label]))
  return services.map(svc =>
    Object.assign(
      {
        model: mMapper[svc.model],
        roles: getAllVsbRoles(svc)
      },
      pickOrIgnore(svc, ['model'])
    )
  )
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
  await authAPI.sign.gen(form.cmpProps)
  await refresh()
  showSgn.value = false
}
function getAllVsbRoles(svc: Service) {
  const roles = store.getters['project/ins'].auth.roles as Role[]
  const mchRoles = []
  for (const { name, rules } of roles) {
    for (const rule of rules) {
      if (chkApiMatchRule(svc, rule)) {
        mchRoles.push(name)
        break
      }
    }
  }
  return mchRoles
}
function chkApiMatchRule(api: Service, rule: Rule): boolean {
  if (rule.method !== 'ALL' && rule.method.toLowerCase() !== api.method.toLowerCase()) {
    return false
  }
  if (rule.path === api.path) {
    return true
  }
  if (api.path.startsWith(rule.path)) {
    switch (rule.value) {
      case '/':
        if (rule.path === api.path) {
          return true
        }
        break
      case '*/*':
        return true
      case '*':
        if (
          api.path
            .substring(rule.path.length)
            .split('/')
            .filter(part => part).length === 1
        ) {
          return true
        }
        break
    }
  }
  return false
}
</script>
