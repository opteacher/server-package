<template>
  <a-descriptions class="mb-12" title="组件基础参数" :column="1" bordered size="small">
    <a-descriptions-item label="关联">
      <a-mentions v-model:value="edtField.refer">
        <a-mentions-option v-for="prop in mdlProps" :key="prop.key" :value="prop.name">
          {{ prop.name }}
        </a-mentions-option>
      </a-mentions>
    </a-descriptions-item>
    <a-descriptions-item label="标签">
      <a-input
        v-model:value="edtField.label"
        @blur="(e: any) => api.form.fields.save({ key: edtField.key, label: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="类型">
      <a-select
        class="w-full"
        v-model:value="edtField.ftype"
        :options="compoOpns"
        @change="(ftype: string) => api.form.fields.save({ key: edtField.key, ftype })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="描述">
      <a-textarea
        v-model:value="edtField.desc"
        :auto-size="{ minRows: 2 }"
        @blur="(e: any) => api.form.fields.save({ key: edtField.key, desc: e.target.value })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="占位提示">
      <a-input
        class="w-full"
        v-model:value="edtField.placeholder"
        @blur="
          (e: any) => api.form.fields.save({
            key: edtField.key,
            placeholder: e.target.value
          })
        "
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts" setup name="FieldProps">
import { compoOpns } from '@/types'
import Field from '@lib/types/field'
import Model from '@/types/model'
import { defineProps, computed, reactive, watch } from 'vue'
import { useStore } from 'vuex'
import { mdlAPI as api } from '@/apis'

const props = defineProps({
  field: { type: Field, required: true }
})
const store = useStore()
const edtField = reactive(props.field)
const mdlProps = computed(() => (store.getters['model/ins'] as Model).props)

watch(
  () => props.field.key,
  () => {
    Field.copy(props.field, edtField, true)
  }
)
</script>
