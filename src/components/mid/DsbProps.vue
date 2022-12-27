<template>
  <a-descriptions class="my-2.5" title="主配置" :column="1" size="small" bordered>
    <a-descriptions-item label="背景颜色">
      <ColorField :color="valState.bkgdColor" @submit="onBkgdColSubmit" />
    </a-descriptions-item>
    <a-descriptions-item label="内边距">
      <a-input-group>
        <a-row :gutter="8">
          <a-col :span="12">
            <a-input-number
              class="w-full"
              v-model:value="valState.padding[0]"
              :min="-1"
              placeholder="上下边距"
              @blur="(e: any) => api.middle.dashboard.save(pid, { 'padding[0]': e.target.value }, refresh)"
            />
          </a-col>
          <a-col :span="12">
            <a-input-number
              class="w-full"
              v-model:value="valState.padding[1]"
              :min="-1"
              placeholder="左右边距"
              @blur="(e: any) => api.middle.dashboard.save(pid, { 'padding[1]': e.target.value }, refresh)"
            />
          </a-col>
        </a-row>
      </a-input-group>
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import MidDsb from '@/types/midDsb'
import { defineComponent, reactive, watch } from 'vue'
import ColorField from '../table/ColorField.vue'
import { pjtAPI as api } from '@/apis'
import { useRoute } from 'vue-router'

export default defineComponent({
  name: 'DashboardProperties',
  components: {
    ColorField
  },
  props: {
    value: { type: MidDsb, required: true }
  },
  emits: ['update:value', 'refresh'],
  setup(props, { emit }) {
    const route = useRoute()
    const pid = route.params.pid as string
    const valState = reactive(props.value)

    watch(
      () => valState,
      () => emit('update:value', valState)
    )

    function refresh() {
      return Promise.resolve(emit('refresh'))
    }
    async function onBkgdColSubmit({ color, next }: { color: string; next: () => void }) {
      valState.bkgdColor = color
      await api.middle.dashboard.save(pid, { bkgdColor: color }, () => refresh().then(next))
    }
    return {
      api,
      pid,
      valState,

      refresh,
      onBkgdColSubmit
    }
  }
})
</script>
