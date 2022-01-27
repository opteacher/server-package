<template>
<div class="container">
  <a-page-header
    style="border: 1px solid rgb(235, 237, 240)"
    :title="route.method"
    :sub-title="route.path"
    @back="() => router.go(-1)"
  >
    <template #extra>
      <a-button @click="$store.commit('route/SET_ROUTE_VSB', true)">
        <SettingOutlined />
      </a-button>
      <FormDialog
        title="配置流程"
        :copy="Route.copy"
        :show="$store.getters['route/routeVsb']"
        :mapper="RouteMapper"
        :object="route"
        @update:show="(show) => $store.commit('route/SET_ROUTE_VSB', show)"
        @submit="onConfig"
      />
    </template>
  </a-page-header>
  <slot/>
</div>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { SettingOutlined } from '@ant-design/icons-vue'
import FormDialog from '../components/com/FormDialog.vue'
import { RouteMapper } from '../views/Flow'
import { Route } from '@/common'
import { reqPut } from '@/utils'

export default defineComponent({
  name: 'FlowDesign',
  components: {
    FormDialog,
    SettingOutlined,
  },
  setup () {
    const store = useStore()
    const router = useRouter()
    const route = computed(() => store.getters['route/ins'])

    async function onConfig (rtForm: any) {
      await reqPut('route',
        route.value.key,
        Route.copy(rtForm),
        { ignores: ['flow'] }
      )
    }
    return {
      Route,

      route,
      router,
      RouteMapper,

      onConfig
    }
  }
})
</script>
