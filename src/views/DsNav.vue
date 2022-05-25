<template>
  <LytMiddle :active="`project/${pid}/ds/navigate`">
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
              padding: selKey === '#' ? '12px' : '14px',
              border: selKey === '#' ? '2px solid #1890ff' : 'none',
              color: navProps.theme === 'dark' ? '#FFFFFFA6' : '#001529',
              'background-color': navProps.theme === 'dark' ? '#001529' : 'white'
            }"
            @click="selKey = '#'"
          >
            <picture-outlined />
            &nbsp;Logo
          </div>
          <a-menu
            :style="{ height: '90%', display: 'flex' }"
            :selectedKeys="[selKey]"
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
              <span>{{ model.name }}</span>
            </a-menu-item>
          </a-menu>
        </div>
      </a-col>
      <a-col :span="8">
        <a-descriptions class="mb-20" title="菜单参数" :column="1" size="small" bordered>
          <template #extra>
            <a-button
              type="primary"
              @click="
                () => {
                  selKey = ''
                }
              "
            >
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
        <a-descriptions v-if="selKey === '#'" title="菜单项参数" :column="1" size="small" bordered>
          <template #extra>
            <a-button
              type="primary"
              @click="
                () => {
                  selKey = ''
                }
              "
            >
              保存
            </a-button>
          </template>
          <a-descriptions-item label="Logo图片">
            <a-upload
              class="w-100"
              name="file"
              :maxCount="1"
              v-model:file-list="navProps.logo"
              action="/server-package/api/v1/image"
              @change="onUpldImgChange"
            >
              <a-button>
                <template #icon><upload-outlined /></template>
                上传图片
              </a-button>
            </a-upload>
          </a-descriptions-item>
        </a-descriptions>
        <a-descriptions v-else-if="selKey" title="菜单项参数" :column="1" size="small" bordered>
          <template #extra>
            <a-button
              type="primary"
              @click="
                () => {
                  selKey = ''
                }
              "
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
          <a-descriptions-item label="连接">
            <a-select
              class="w-100"
              :options="[
                { label: '啊啊啊', value: 'aaa' },
                { label: '不不不', value: 'bbb' }
              ]"
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
import { BorderlessTableOutlined, PictureOutlined, UploadOutlined } from '@ant-design/icons-vue'
import Model from '../types/model'
import IconField from '../components/navi/IconField.vue'

export default defineComponent({
  name: 'DesignNavigate',
  components: {
    LytMiddle,
    IconField,
    BorderlessTableOutlined,
    PictureOutlined,
    UploadOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const selKey = ref('')
    const models = computed(() => store.getters['project/ins'].models)
    const navProps = reactive({
      theme: 'dark' as 'dark' | 'light',
      logo: []
    })
    const nvItmProps = reactive(new Model())

    onMounted(() => store.dispatch('project/refresh'))

    function onMuItemSelect({ key }: { key: string }) {
      selKey.value = key
      Model.copy(
        models.value.find((model: Model) => model.key === key),
        nvItmProps
      )
    }
    function onUpldImgChange() {}
    return {
      pid,
      models,
      selKey,
      navProps,
      nvItmProps,

      onMuItemSelect,
      onUpldImgChange
    }
  }
})
</script>
