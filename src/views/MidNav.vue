<template>
  <LytMiddle :active="`project/${pid}/mid/navigate`">
    <a-row style="height: 65vh" :gutter="24">
      <a-col :span="16" style="background-color: #ededed" @click="selMuKey = ''">
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
              'background-color': navProps.theme === 'dark' ? '#001529' : 'white',
              'background-image': navProps.logo ? `url(${navProps.logo})` : ''
            }"
            @click.stop="selMuKey = '#'"
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
            <ModelMenu v-for="mdl of models" :key="mdl.key" :mkey="mdl.key" :model="mdl" />
          </a-menu>
        </div>
      </a-col>
      <a-col :span="8">
        <a-descriptions class="mb-20" title="菜单参数" :column="1" size="small" bordered>
          <a-descriptions-item label="主路由">
            <a-input
              v-model:value="navProps.path"
              @change="() => (navProps.path = fixStartsWith(navProps.path, '/'))"
              @blur="(e: any) => pjtAPI.middle.navigate.save(pid, { path: e.target.value }, refresh)"
            />
          </a-descriptions-item>
          <a-descriptions-item label="主题颜色">
            <a-select
              class="w-full"
              :options="[
                { label: '深色', value: 'dark' },
                { label: '浅色', value: 'light' }
              ]"
              v-model:value="navProps.theme"
              @change="(theme: string) => pjtAPI.middle.navigate.save(pid, { theme }, refresh)"
            />
          </a-descriptions-item>
        </a-descriptions>
        <a-descriptions v-if="selMuKey === '#'" title="Logo参数" :column="1" size="small" bordered>
          <a-descriptions-item label="Logo图片">
            <a-upload
              name="file"
              :maxCount="1"
              :multiple="false"
              :showUploadList="false"
              action="/server-package/api/v1/temp/image"
              @change="onUploadLogoImg"
            >
              <a-button class="w-full">
                <template #icon><upload-outlined /></template>
                上传图片
              </a-button>
            </a-upload>
          </a-descriptions-item>
        </a-descriptions>
        <a-descriptions v-else-if="selMuKey" title="菜单项参数" :column="1" size="small" bordered>
          <a-descriptions-item label="菜单图标">
            <IconField
              :icon="nvItmProps.icon"
              @select="(icon: string) => mdlAPI.update(Object.assign(nvItmProps, { icon }), refresh)"
            />
          </a-descriptions-item>
          <a-descriptions-item label="标签名">
            <a-input
              v-model:value="nvItmProps.label"
              @blur="(e: any) => mdlAPI.update(Object.assign(nvItmProps, { label: e.target.value }), refresh)"
            />
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
import Model from '../types/model'
import MidNav from '@/types/midNav'
import { pjtAPI, mdlAPI } from '../apis'
import { fixStartsWith } from '@/utils'
import ModelMenu from '../components/mid/ModelMenu.vue'
import { PictureOutlined, UploadOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'MiddleNavigate',
  components: {
    LytMiddle,
    ModelMenu,

    PictureOutlined,
    UploadOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid as string
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
        nvItmProps,
        true
      )
    }
    function onUpldImgChange() {
      console.log()
    }
    function mdlEqual(
      mdl1: { icon: string; label: string },
      mdl2: { icon: string; label: string }
    ) {
      return mdl1.icon === mdl2.icon && mdl1.label === mdl2.label
    }
    function onUploadLogoImg(e: any) {
      if (e.file && e.file.status === 'done') {
        navProps.logo = e.file.response.result
        pjtAPI.middle.navigate.save(pid, { logo: e.file.response.result }, refresh)
      }
    }
    return {
      pid,
      pjtAPI,
      mdlAPI,
      models,
      selMuKey,
      midNav,
      navProps,
      nvItmProps,
      selModel,

      refresh,
      fixStartsWith,
      onMuItemSelect,
      onUpldImgChange,
      mdlEqual,
      onUploadLogoImg
    }
  }
})
</script>
