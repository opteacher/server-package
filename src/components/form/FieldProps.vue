<template>
  <a-descriptions class="mb-12" title="组件基础参数" :column="1" bordered size="small">
    <a-descriptions-item label="关联">
      <a-mentions v-model:value="fieldState.refer">
        <a-mentions-option v-for="prop in mdlProps" :key="prop.key" :value="prop.name">
          {{ prop.name }}
        </a-mentions-option>
      </a-mentions>
    </a-descriptions-item>
    <a-descriptions-item label="标签">
      <a-input
        v-model:value="fieldState.label"
        @blur="(e: any) => emit('update:field', { key: fieldState.key, label: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="类型">
      <a-select
        class="w-full"
        v-model:value="fieldState.ftype"
        :options="compoOpns"
        @change="(ftype: string) => emit('update:field', { key: fieldState.key, ftype })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="描述">
      <a-textarea
        v-model:value="fieldState.desc"
        :auto-size="{ minRows: 2 }"
        @blur="(e: any) => emit('update:field', { key: fieldState.key, desc: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="占位提示">
      <a-input
        class="w-full"
        v-model:value="fieldState.placeholder"
        @blur="
          (e: any) => emit('update:field', {
            key: fieldState.key,
            placeholder: e.target.value
          })
        "
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts" setup name="FieldProps">
import { compoOpns } from '@/types'
import Model from '@/types/model'
import Property from '@/types/property'
import Field from '@lib/types/field'
import { cloneDeep } from 'lodash'
import { computed, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({
  field: { type: Field, required: true }
})
const emit = defineEmits(['update:field'])
const store = useStore()
const mdlProps = computed<Property[]>(() => (store.getters['model/ins'] as Model).props)
const fieldState = ref(new Field())

onMounted(refresh)
watch(() => props.field, refresh)

function refresh() {
  fieldState.value = cloneDeep(props.field)
}
</script>
