<template>
  <a-row :gutter="[16, 24]">
    <a-col v-for="model of models" :key="model.key" :span="8">
      <a-card hoverable>
        <template #title>{{ model.name }} - {{ model.label }}</template>
        <template #extra>
          <a-popover overlayClassName="popmu-p-0" trigger="click">
            <template #content>
              <a-menu mode="vertical" @click="({ key }) => onMdlOprClick(key, model)">
                <a-menu-item key="design">
                  <template #icon><FormOutlined /></template>
                  <span>表单/表项设计</span>
                </a-menu-item>
                <a-divider class="my-0" />
                <a-menu-item key="export">
                  <template #icon><ExportOutlined /></template>
                  <span>导出</span>
                </a-menu-item>
                <a-menu-item key="delete">
                  <template #icon><DeleteOutlined /></template>
                  <span>删除</span>
                </a-menu-item>
              </a-menu>
            </template>
            <a-button type="text">
              <template #icon><MoreOutlined /></template>
            </a-button>
          </a-popover>
        </template>

        <ul class="list-none pl-0 mb-0">
          <li v-for="prop of model.props" :key="prop.key">
            {{ prop.name }}
            <a-tag :color="bsTpCol[prop.ptype]" :bordered="false">{{ prop.ptype }}</a-tag>
            - {{ prop.label }}
          </li>
        </ul>
        <a-divider class="my-5" />

        <a-tooltip v-for="svc in mSvcMapper[model.key]" :key="svc.key">
          <template #title>{{ svc.path }}</template>
          <a-tag class="cursor-pointer" :color="mthdClrs[svc.method]">
            {{ svc.method }}
          </a-tag>
        </a-tooltip>
      </a-card>
    </a-col>
  </a-row>
</template>

<script setup lang="ts">
import { mdlAPI as api } from '@/apis'
import Model from '@/types/model'
import { computed, onMounted, ref } from 'vue'
import Service, { mthdClrs } from '@/types/service'
import store from '@/store'
import Project from '@/types/project'
import { MoreOutlined, FormOutlined, ExportOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { bsTpCol } from '@/types'
import { useRoute, useRouter } from 'vue-router'

const router = useRouter()
const route = useRoute()
const pid = route.params.pid
const models = ref<Model[]>([])
const mSvcMapper = computed<Record<string, Service[]>>(() => {
  const ret: Record<string, Service[]> = {}
  const pjt = store.getters['project/ins'] as Project
  for (const svc of pjt.services.filter(svc => svc.model)) {
    if (svc.model in ret) {
      ret[svc.model].push(svc)
    } else {
      ret[svc.model] = [svc]
    }
  }
  return ret
})

onMounted(async () => {
  models.value = await api.all()
})

function onMdlOprClick(selKey: 'design' | 'export' | 'delete', model: Model) {
  switch (selKey) {
    case 'design':
      router.push(`/server-package/project/${pid}/model/${model.key}/form`)
      break
    case 'export':
      // onExpClsClick(model)
      break
    case 'delete':
      break
  }
}
</script>
