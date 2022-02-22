<template>
  <div class="container">
    <a-page-header
      id="formHeader"
      style="border: 1px solid rgb(235, 237, 240)"
      :title="model.name"
      :sub-title="model.desc"
      @back="() => router.go(-1)"
    >
      <template #extra>
        <a-radio-group :value="dsgnMod" @change="onDsgnChange">
          <a-radio-button value="form">表单设计</a-radio-button>
          <a-radio-button value="table">表项设计</a-radio-button>
        </a-radio-group>
        <a-button @click="fmEmitter.emit('update:show', true)">预览</a-button>
        <DemoForm :emitter="fmEmitter" />
        <a-button key="1" type="primary">发布</a-button>
      </template>
      <a-descriptions size="small" :column="5">
        <a-descriptions-item v-for="prop in model.props" :key="prop.key" :label="prop.label">
          {{ prop.name }}
        </a-descriptions-item>
      </a-descriptions>
    </a-page-header>
    <slot />
  </div>
</template>

<script lang="ts">
import { waitFor } from '@/utils'
import { computed, defineComponent, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import DemoForm from '../components/DemoForm.vue'

export default defineComponent({
  name: 'DesignLayout',
  emits: ['change:height'],
  components: {
    DemoForm
  },
  setup(_props, { emit }) {
    const store = useStore()
    const route = useRoute()
    const router = useRouter()
    const model = computed(() => store.getters['model/ins'])
    const rszObs = new ResizeObserver(onFieldResized)
    const fmEmitter = new Emitter()
    const dsgnMod = computed(() => store.getters['model/dsgnMod'])

    onMounted(async () => {
      await store.dispatch('model/refresh')
      rszObs.observe(await onFieldResized())
    })

    async function onFieldResized() {
      const el = (await waitFor('formHeader')) as HTMLElement
      emit('change:height', el.clientHeight)
      return el
    }
    function onDsgnChange(e: Event) {
      router.push(
        `/server-package/project/${route.params.pid}/${(e.target as any).value}/${route.params.mid}`
      )
    }
    return {
      store,
      router,
      model,
      fmEmitter,
      dsgnMod,

      onDsgnChange
    }
  }
})
</script>
