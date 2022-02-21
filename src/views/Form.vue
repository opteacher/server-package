<template>
  <LytForm>
    <a-layout class="h-100">
      <a-layout-sider width="20%" :style="{ padding: '20px', background: 'white' }">
        <div class="ant-descriptions-title mb-20">组件表</div>
        <a-list :grid="{ gutter: 16, column: 2 }" :data-source="compos">
          <template #renderItem="{ item: compo }">
            <a-list-item>
              <CompoCard :compo="compo" />
            </a-list-item>
          </template>
        </a-list>
      </a-layout-sider>
      <a-layout-content class="main-panel" @click="active = ''">
        <a-tabs style="background-color: white" v-model:activeKey="actTab" type="card">
          <a-tab-pane key="design" tab="设计">
            <a-form
              :style="{ width: `${form.width}%`, margin: '0 auto', position: 'relative' }"
              :label-col="{ span: form.labelWidth }"
              :wrapper-col="{ span: 24 - form.labelWidth }"
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
          </a-tab-pane>
          <a-tab-pane key="review" tab="预览" force-render>Content of Tab Pane 2</a-tab-pane>
        </a-tabs>
      </a-layout-content>
      <a-layout-sider width="30%" :style="{ padding: '20px', background: 'white' }">
        <a-descriptions class="mb-50" title="表单参数" :column="1" bordered size="small">
          <a-descriptions-item label="表单宽度">
            <a-input-number
              class="w-100"
              :value="form.width"
              :min="1"
              :max="100"
              :formatter="value => `${value}%`"
              @change="width => store.dispatch('model/saveForm', { width })"
            />
          </a-descriptions-item>
          <a-descriptions-item label="标签宽度">
            <a-input-number
              class="w-100"
              :value="form.labelWidth"
              :min="1"
              :max="23"
              @change="labelWidth => store.dispatch('model/saveForm', { labelWidth })"
            />
          </a-descriptions-item>
        </a-descriptions>
        <a-descriptions class="mb-50" title="组件基础参数" :column="1" bordered size="small">
          <a-descriptions-item label="关联">
            <a-mentions :disabled="!actField" :value="actField?.refer" autofocus>
              <a-mentions-option v-for="prop in props" :key="prop.key" :value="prop.name">
                {{ prop.name }}
              </a-mentions-option>
            </a-mentions>
          </a-descriptions-item>
          <a-descriptions-item label="标签">
            <a-input
              :disabled="!actField"
              :value="actField?.label"
              @change="
                e => store.dispatch('model/saveField', { key: actField.key, label: e.target.value })
              "
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
              @change="
                e => store.dispatch('model/saveField', { key: actField.key, desc: e.target.value })
              "
            />
          </a-descriptions-item>
        </a-descriptions>
        <template v-if="actField">
          <InputProps v-if="actField.type === 'Input'" :field="actField" />
        </template>
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
import Form from '@/types/form'
import Model from '@/types/model'
import InputProps from '../components/InputProps.vue'

export default defineComponent({
  name: 'Form',
  components: {
    LytForm,
    CompoCard,
    FieldCard,
    InputProps
  },
  setup() {
    const store = useStore()
    const compos = computed(() => store.getters['model/compos'] as Compo[])
    const fields = computed(() => store.getters['model/fields'] as Record<string, Field>)
    const active = ref('')
    const actField = computed(() => fields.value[active.value])
    const form = computed(() => store.getters['model/form'] as Form)
    const props = computed(() => (store.getters['model/ins'] as Model).props)
    const actTab = ref('design')

    return {
      store,
      compos,
      props,
      active,
      fields,
      actField,
      compoTypes,
      form,
      actTab
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

.main-panel {
  padding: 20px;
  width: 50%;
}
</style>
