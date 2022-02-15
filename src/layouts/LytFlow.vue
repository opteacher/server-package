<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="svc.method"
      :sub-title="`/${pjt.name}${svc.path}`"
      @back="() => router.go(-1)"
    >
      <template #extra>
        <a-button @click="store.commit('service/SET_SVC_VSB', true)">
          <SettingOutlined />
        </a-button>
        <FormDialog
          title="配置流程"
          :copy="Service.copy"
          :show="store.getters['service/svcVsb']"
          :mapper="ServiceMapper"
          :object="svc"
          @update:show="show => store.commit('service/SET_SVC_VSB', show)"
          @submit="onConfig"
        />
        <a-button @click="store.dispatch('service/refresh')">
          <ReloadOutlined />
          &nbsp;刷新
        </a-button>
      </template>
    </a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { SettingOutlined, ReloadOutlined } from '@ant-design/icons-vue'
import FormDialog from '../components/com/FormDialog.vue'
import { ServiceMapper } from '../views/Flow'
import { Service, Project, Dep, Model } from '@/common'
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
    const svc = computed(() => store.getters['service/ins'])
    const pjt = computed(() => store.getters['service/pjt'])

    async function onConfig(svcForm: any) {
      await reqPut('service', svc.value.key, svcForm, { ignores: ['flow'] })
      await store.dispatch('service/refresh')
    }
    return {
      Service,

      store,
      router,
      pjt,
      svc,
      ServiceMapper,

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
