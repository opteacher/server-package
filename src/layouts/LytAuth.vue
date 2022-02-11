<template>
  <div class="container">
    <a-page-header
      style="border: 1px solid rgb(235, 237, 240)"
      :title="project.name"
      @back="() => $router.go(-1)"
    >
      <template #extra>
        <a-button type="primary" @click="onBindMdlShow(true)">绑定模型</a-button>
        <FormDialog
          title="绑定模型"
          :show="bmVisible"
          :copy="BindModel.copy"
          :mapper="bmMapper"
          :emitter="bmEmitter"
          @update:show="onBindMdlShow"
          @submit="onBindMdlSubmit"
        />
      </template>
      <!-- <a-descriptions size="small" :column="5">
        <a-descriptions-item v-for="prop in model.props" :key="prop.key" :label="prop.name">
          {{ prop.type }}
        </a-descriptions-item>
      </a-descriptions> -->
    </a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { computed, defineComponent, onMounted } from 'vue'
import { useStore } from 'vuex'
import FormDialog from '../components/com/FormDialog.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Mapper, Model, Property } from '@/common'
import { bmVisible, BindModel } from '@/views/Auth'
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
    const bmEmitter = new Emitter()
    const bmMapper = new Mapper({
      model: {
        label: '模型',
        type: 'Select',
        options: [],
        onDropdown: async (open: boolean) => {
          if (open) {
            bmMapper['model'].loading = true
            bmEmitter.emit('update:mapper', bmMapper)
            await store.dispatch('auth/refresh')
            bmMapper['model'].options = store.getters['project/ins'].models.map((mdl: Model) => ({
              label: mdl.name,
              value: mdl.key
            }))
            bmMapper['model'].loading = false
            bmEmitter.emit('update:mapper', bmMapper)
          }
        },
        onChange: (_record: BindModel, to: string) => {
          const model = store.getters['project/ins'].models.find((mdl: Model) => mdl.key === to)
          const propOpns = model.props.map((prop: Property) => ({
            label: prop.name,
            value: prop.key
          }))
          bmMapper['idProps'].options = propOpns
          bmMapper['pwdProp'].options = propOpns
          bmEmitter.emit('update:mapper', bmMapper)
        }
      },
      idProps: {
        label: '标识字段',
        type: 'EditList',
        mode: 'select'
      },
      pwdProp: {
        label: '密码字段',
        type: 'SelOrIpt',
        mode: 'select'
      }
    })

    async function onBindMdlShow(show: boolean) {
      if (!show) {
        await store.dispatch('auth/refresh')
        if (!store.getters['auth/ins'].key) {
          router.go(-1)
        }
      }
      bmVisible.value = show
    }
    async function onBindMdlSubmit(form: any, refresh: () => void) {
      form.idProps = form.idProps.map((prop: { value: string }) => prop.value)
      await store.dispatch('auth/bindModel', BindModel.copy(form))
      refresh()
    }
    return {
      BindModel,

      project,
      bmVisible,
      bmEmitter,
      bmMapper,

      onBindMdlShow,
      onBindMdlSubmit
    }
  }
})
</script>
