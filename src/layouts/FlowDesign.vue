<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="api.method"
      :sub-title="`/${project.name}${api.path}`"
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
      </template>
    </a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { SettingOutlined } from '@ant-design/icons-vue'
import FormDialog from '../components/com/FormDialog.vue'
import { ApiMapper } from '../views/Flow'
import { Service, Node, Project } from '@/common'
import { reqGet, reqLink, reqPut } from '@/utils'

export default defineComponent({
  name: 'FlowDesign',
  components: {
    FormDialog,
    SettingOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const api = computed(() => store.getters['service/ins'])
    const project = reactive(new Project())

    onMounted(async () => {
      Project.copy((await reqGet('project', route.params.pid)).data, project)
    })

    async function onConfig(rtForm: any) {
      await reqPut('service', api.value.key, rtForm, { ignores: ['flow', 'deps'] })
      await reqLink(
        {
          parent: ['service', api.value.key],
          child: ['deps', '']
        },
        false
      )
      for (const { key } of rtForm.deps) {
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
      project,
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
