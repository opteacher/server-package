<template>
  <a-descriptions class="mb-50" title="组件基础参数" :column="1" bordered size="small">
    <a-descriptions-item label="关联">
      <a-mentions :value="field?.refer">
        <a-mentions-option v-for="prop in props" :key="prop.key" :value="prop.name">
          {{ prop.name }}
        </a-mentions-option>
      </a-mentions>
    </a-descriptions-item>
    <a-descriptions-item label="标签">
      <a-input
        :value="field?.label"
        @change="(e: any) => api.form.fields.save({ key: field.key, label: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="类型">
      <a-select
        class="w-100"
        :value="field?.ftype"
        :options="compoTypes.map(cmpTyp => ({ label: cmpTyp, value: cmpTyp }))"
      />
    </a-descriptions-item>
    <a-descriptions-item label="描述">
      <a-textarea
        :value="field?.desc"
        :auto-size="{ minRows: 2 }"
        @change="(e: any) => api.form.fields.save({ key: field.key, desc: e.target.value })"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import { compoTypes } from '@/types'
import Field from '@/types/field'
import Model from '@/types/model'
import { computed, defineComponent } from 'vue'
import { useStore } from 'vuex'
import { mdlAPI as api } from '@/apis'

export default defineComponent({
  name: 'TableProps',
  props: {
    field: { type: Field, required: true }
  },
  setup() {
    const store = useStore()
    const props = computed(() => (store.getters['model/ins'] as Model).props)
    return {
      api,
      props,
      compoTypes
    }
  }
})
</script>
