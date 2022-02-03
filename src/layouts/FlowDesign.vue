<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="api.method"
      :sub-title="`/${pjt.name}${api.path}`"
      @back="() => router.go(-1)"
    >
      <template #extra>
        <a-button @click="$store.commit('service/SET_API_VSB', true)">
          <SettingOutlined />
        </a-button>
        <FormDialog
          title="配置流程"
          :copy="Service.copy"
          :show="$store.getters['service/apiVsb']"
          :mapper="ApiMapper"
          :object="api"
          @update:show="show => $store.commit('service/SET_API_VSB', show)"
          @submit="onConfig"
        />
        <a-button @click="$store.commit('service/refresh')">
          <ReloadOutlined />
          &nbsp;刷新
        </a-button>
      </template>
    </a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import FormDialog from '../components/com/FormDialog.vue'
import { ApiMapper } from '../views/Flow'
import { Service, Node, Project, Dependency, Model } from '@/common'
import { reqLink, reqPut } from '@/utils'

export default defineComponent({
  name: 'FlowDesign',
  components: {
    FormDialog,
    SettingOutlined,
    ReloadOutlined
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const api = computed(() => store.getters['service/ins'])
    const pjt = computed(() => store.getters['service/pjt'])

    onMounted(() => store.dispatch('service/refresh'))

    async function onConfig(svcForm: any) {
      await reqPut('service', api.value.key, svcForm, { ignores: ['flow', 'deps'] })
      await reqLink(
        {
          parent: ['service', api.value.key],
          child: ['deps', '']
        },
        false
      )
      const depKeys = store.getters['service/deps'].map((dep: Dependency) => dep.key)
      for (const { key } of svcForm.deps) {
        if (!depKeys.includes(key)) {
          const model = (pjt.value as Project).models.find((mdl: Model) => mdl.key === key)
          if (model) {
            await reqPut('dependency', key, {
              _id: key,
              name: model.name,
              exports: [model.name],
              from: `../models/${model.name}.js`,
              default: true
            })
          }
        }
        await reqLink({
          parent: ['service', api.value.key],
          child: ['deps', key]
        })
      }
      await store.dispatch('service/refresh')
    }
    return {
      Node,
      Service,

      router,
      pjt,
      api,
      ApiMapper,

      onConfig
    }
  }
})
</script>

<style lang="less">
.collapse-ptb-0 {
  .ant-collapse-content-box {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}
</style>
