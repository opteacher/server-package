<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="project.name"
      @back="() => $router.go(-1)"
    >
      <template #extra>
        <a-button type="primary" @click="onAuthShow(true)">绑定模型</a-button>
        <FormDialog
          title="绑定模型"
          :show="authVisible"
          :copy="Auth.copy"
          :mapper="authMapper"
          :emitter="authEmitter"
          :object="auth"
          @update:show="onAuthShow"
          @submit="onAuthSave"
        />
      </template>
      <a-descriptions size="small" :column="5">
        <a-descriptions-item v-if="auth.key" label="绑定的模型">
          {{ getModelName(auth.model) }}
        </a-descriptions-item>
      </a-descriptions>
    </a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { computed, defineComponent, ref, onMounted } from 'vue'
import { useStore } from 'vuex'
import FormDialog from '../components/com/FormDialog.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Auth, Cond, Mapper, Model } from '@/common'
import { useRouter } from 'vue-router'

export default defineComponent({
  name: 'AuthorizationLayout',
  components: {
    FormDialog
  },
  setup() {
    const store = useStore()
    const router = useRouter()
    const project = computed(() => store.getters['project/ins'])
    const auth = computed(() => store.getters['auth/ins'])
    const authVisible = ref(false)
    const authEmitter = new Emitter()
    const authMapper = new Mapper({
      model: {
        label: '模型',
        type: 'Select',
        options: []
      },
      opera: {
        label: '操作',
        type: 'Button',
        inner: '解除绑定',
        danger: true,
        onClick: async () => {
          await store.dispatch('auth/unbindModel')
        },
        display: [Cond.copy({ key: 'key', cmp: '!=', val: '' })]
      }
    })

    onMounted(async () => {
      await store.dispatch('auth/refresh')
      if (!auth.value.key) {
        onAuthShow(true)
      }
    })

    async function updAuthMapper() {
      authMapper['model'].loading = true
      authEmitter.emit('update:mapper', authMapper)
      await store.dispatch('auth/refresh')
      authMapper['model'].options = project.value.models.map((mdl: Model) => ({
        label: mdl.name,
        value: mdl.key
      }))
      authMapper['model'].loading = false
      authEmitter.emit('update:mapper', authMapper)
    }
    async function onAuthShow(show: boolean) {
      if (!show) {
        await store.dispatch('auth/refresh')
        if (!auth.value.key) {
          router.go(-1)
        }
      } else {
        await updAuthMapper()
      }
      authVisible.value = show
    }
    async function onAuthSave(form: any, refresh: () => void) {
      await store.dispatch('auth/bindModel', Auth.copy(form))
      refresh()
    }
    function getModelName(mid: string) {
      return project.value.models.find((mdl: Model) => mdl.key === mid).name
    }
    return {
      Auth,

      auth,
      project,
      authVisible,
      authEmitter,
      authMapper,

      onAuthShow,
      onAuthSave,
      getModelName
    }
  }
})
</script>
