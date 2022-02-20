<template>
  <LytForm>
    <a-layout class="h-100">
      <a-layout-sider width="20%" :style="{ padding: '20px', background: '#ececec' }">
        <a-list :grid="{ gutter: 16, column: 2 }" :data-source="compos">
          <template #renderItem="{ item: compo }">
            <a-list-item>
              <CompoCard :compo="compo" />
            </a-list-item>
          </template>
        </a-list>
      </a-layout-sider>
      <a-layout-content :style="{ padding: '20px', width: '50%' }" @click="active = ''">
        <a-form
          :style="{ width: '50%', margin: '0 auto', position: 'relative' }"
          :label-col="{ span: 4 }"
          :wrapper-col="{ span: 20 }"
        >
          <template v-for="(field, index) in Object.values(fields)" :key="field.key">
            <FieldCard
              :index="index"
              :field="field"
              :active="active"
              @update:active="act => (active = act)"
              @drag="act => (active = act)"
            />
          </template>
        </a-form>
      </a-layout-content>
      <a-layout-sider width="30%" :style="{ padding: '20px', background: '#ececec' }">
        <a-descriptions title="组件参数" :column="1" bordered>
          <a-descriptions-item label="标题">
            <a-input
              :disabled="!actField"
              :value="actField?.label"
              @change="e => (fields[active].label = e.target.value)"
            />
          </a-descriptions-item>
          <a-descriptions-item label="类型">
            <a-select
              :disabled="!actField"
              class="w-100"
              :value="actField?.type"
              :options="compoTypes.map(cmpTyp => ({ label: cmpTyp, value: cmpTyp }))"
            />
          </a-descriptions-item>
          <a-descriptions-item label="描述">
            <a-textarea
              :disabled="!actField"
              :value="actField?.desc"
              :auto-size="{ minRows: 2 }"
              @change="e => (fields[active].desc = e.target.value)"
            />
          </a-descriptions-item>
          <a-descriptions-item label="Order time">2018-04-24 18:00:00</a-descriptions-item>
        </a-descriptions>
      </a-layout-sider>
    </a-layout>
  </LytForm>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, ref } from 'vue'
import LytForm from '../layouts/LytForm.vue'
import CompoCard from '../components/CompoCard.vue'
import FieldCard from '../components/FieldCard.vue'
import { compoTypes } from '../types'
import { useStore } from 'vuex'
import Field from '@/types/field'
import Compo from '@/types/compo'

export default defineComponent({
  name: 'Form',
  components: {
    LytForm,
    CompoCard,
    FieldCard
  },
  setup() {
    const store = useStore()
    const compos = computed(() => store.getters['model/compos'] as Compo[])
    const fields = computed(() => store.getters['model/fields'] as Record<string, Field>)
    const active = ref('')
    const actField = computed(() => fields.value[active.value])

    return {
      compos,
      active,
      fields,
      actField,
      compoTypes
    }
  }
})
</script>

<style lang="less">
.bd-form-item {
  border-top: 1px solid #108ee9;
  border-left: 1px solid #108ee9;
  border-right: 1px solid #108ee9;
}

.bd-form-oper {
  border-left: 1px solid #108ee9;
  border-right: 1px solid #108ee9;
  border-bottom: 1px solid #108ee9;
}
</style>
