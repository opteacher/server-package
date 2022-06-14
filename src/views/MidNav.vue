<template>
  <LytMiddle :active="`project/${pid}/mid/navigate`">
    <a-row style="height: 65vh" :gutter="24">
      <a-col :span="16" style="background-color: #ededed">
        <div
          :style="{
            width: '25vw',
            height: '100%',
            margin: '0 auto'
          }"
        >
          <div
            :style="{
              height: '10%',
              cursor: 'pointer',
              padding: selMuKey === '#' ? '12px' : '14px',
              border: selMuKey === '#' ? '2px solid #1890ff' : 'none',
              color: navProps.theme === 'dark' ? '#FFFFFFA6' : '#001529',
              'background-color': navProps.theme === 'dark' ? '#001529' : 'white'
            }"
            @click="selMuKey = '#'"
          >
            <picture-outlined />
            &nbsp;Logo
          </div>
          <a-menu
            :style="{ height: '90%' }"
            :selectedKeys="[selMuKey]"
            mode="inline"
            :theme="navProps.theme"
            @select="onMuItemSelect"
          >
            <a-menu-item v-for="model of models" :key="model.key">
              <template #icon>
                <keep-alive v-if="model.icon">
                  <component :is="model.icon" />
                </keep-alive>
              </template>
              <span>{{ model.label || model.name }}</span>
            </a-menu-item>
          </a-menu>
        </div>
      </a-col>
      <a-col :span="8">
        <a-descriptions class="mb-20" title="菜单参数" :column="1" size="small" bordered>
          <template #extra>
            <a-button :type="!navProps.equals(midNav) ? 'primary' : 'default'" @click="onNaviSave">
              保存
            </a-button>
          </template>
          <a-descriptions-item label="主题颜色">
            <a-select
              class="w-100"
              :options="[
                { label: '深色', value: 'dark' },
                { label: '浅色', value: 'light' }
              ]"
              v-model:value="navProps.theme"
            />
          </a-descriptions-item>
        </a-descriptions>
        <a-descriptions v-if="selMuKey === '#'" title="Logo参数" :column="1" size="small" bordered>
          <template #extra>
            <a-button
              :type="!navProps.equals(midNav) ? 'primary' : 'default'"
              @click="
                () => {
                  selMuKey = ''
                }
              "
            >
              保存
            </a-button>
          </template>
          <a-descriptions-item label="Logo图片">
            <a-upload
              name="file"
              :maxCount="1"
              v-model:file-list="navProps.logo"
              action="/server-package/api/v1/image"
              @change="onUpldImgChange"
            >
              <a-button class="w-100">
                <template #icon><upload-outlined /></template>
                上传图片
              </a-button>
            </a-upload>
          </a-descriptions-item>
        </a-descriptions>
        <a-descriptions v-else-if="selMuKey" title="菜单项参数" :column="1" size="small" bordered>
          <template #extra>
            <a-button
              :type="!mdlEqual(selModel, nvItmProps) ? 'primary' : 'default'"
              @click="onNvItmSave"
            >
              保存
            </a-button>
          </template>
          <a-descriptions-item label="菜单图标">
            <IconField
              :icon="nvItmProps.icon"
              @select="(icon: string) => { nvItmProps.icon = icon }"
            />
          </a-descriptions-item>
          <a-descriptions-item label="标签名">
            <a-input v-model:value="nvItmProps.label" />
          </a-descriptions-item>
        </a-descriptions>
      </a-col>
    </a-row>
  </LytMiddle>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import LytMiddle from '../layouts/LytMiddle.vue'
import * as antdIcons from '@ant-design/icons-vue/lib/icons'
import Model from '../types/model'
import IconField from '../components/navi/IconField.vue'
import MidNav from '@/types/midNav'
import { pjtAPI, mdlAPI } from '../apis'

export default defineComponent({
  name: 'MiddleNavigate',
  components: Object.assign(
    {
      LytMiddle,
      IconField
    },
    antdIcons
  ),
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const selMuKey = ref('')
    const selModel = computed(() => store.getters['project/model'](selMuKey.value))
    const models = computed(() => store.getters['project/ins'].models)
    const midNav = computed(() => store.getters['project/ins'].middle.navigate)
    const navProps = reactive(new MidNav())
    const nvItmProps = reactive(new Model())

    onMounted(refresh)

    async function refresh() {
      selMuKey.value = ''
      await store.dispatch('project/refresh')
      MidNav.copy(store.getters['project/ins'].middle.navigate, navProps)
    }
    function onMuItemSelect({ key }: { key: string }) {
      selMuKey.value = key
      Model.copy(
        models.value.find((model: Model) => model.key === key),
        nvItmProps
      )
    }
    function onUpldImgChange() {
      console.log()
    }
    async function onNaviSave() {
      await pjtAPI.middle.navigate.save(pid, navProps)
      await refresh()
    }
    async function onNvItmSave() {
      await mdlAPI.update({ key: selMuKey.value, icon: nvItmProps.icon, label: nvItmProps.label })
      await refresh()
    }
    function mdlEqual(
      mdl1: { icon: string; label: string },
      mdl2: { icon: string; label: string }
    ) {
      return mdl1.icon === mdl2.icon && mdl1.label === mdl2.label
    }
    return {
      pid,
      models,
      selMuKey,
      midNav,
      navProps,
      nvItmProps,
      selModel,

      onMuItemSelect,
      onUpldImgChange,
      onNaviSave,
      onNvItmSave,
      mdlEqual
    }
  }
})
</script>
