<template>
  <LytDesign @change:height="height => (hdHeight = height)">
    <div class="form-container" :style="{ top: `${40 + hdHeight}px` }">
      <a-layout class="h-100">
        <a-layout-sider width="20%" class="white-bkgd p-20 vertical-scroll">
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
          <div class="white-bkgd h-100">
            <a-empty
              class="ptb-30"
              v-if="!fields.length"
              description="无组件"
              @dragover="e => e.preventDefault()"
              @drop="onDropDown"
            />
            <a-form
              v-else
              :style="{ width: `${form.width}%`, margin: '0 auto', position: 'relative' }"
              :label-col="{ span: form.labelWidth }"
              :wrapper-col="{ span: 24 - form.labelWidth }"
            >
              <template v-for="(field, index) in fields" :key="field.key">
                <FieldCard
                  :index="index"
                  :field="field"
                  :active="active"
                  @update:active="act => (active = act)"
                  @drag="act => (active = act)"
                />
              </template>
            </a-form>
          </div>
        </a-layout-content>
        <a-layout-sider width="30%" class="white-bkgd p-20 vertical-scroll">
          <a-descriptions
            v-show="!actField"
            class="mb-50"
            title="表单参数"
            :column="1"
            bordered
            size="small"
          >
            <a-descriptions-item label="标题">
              <a-input
                :value="form.title"
                @change="e => store.dispatch('model/saveForm', { title: e.target.value })"
              />
            </a-descriptions-item>
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
          <a-descriptions
            v-show="actField"
            class="mb-50"
            title="组件基础参数"
            :column="1"
            bordered
            size="small"
          >
            <a-descriptions-item label="关联">
              <a-mentions :value="actField?.refer">
                <a-mentions-option v-for="prop in props" :key="prop.key" :value="prop.name">
                  {{ prop.name }}
                </a-mentions-option>
              </a-mentions>
            </a-descriptions-item>
            <a-descriptions-item label="标签">
              <a-input
                :value="actField?.label"
                @change="
                  e =>
                    store.dispatch('model/saveField', { key: actField.key, label: e.target.value })
                "
              />
            </a-descriptions-item>
            <a-descriptions-item label="类型">
              <a-select
                class="w-100"
                :value="actField?.type"
                :options="compoTypes.map(cmpTyp => ({ label: cmpTyp, value: cmpTyp }))"
              />
            </a-descriptions-item>
            <a-descriptions-item label="描述">
              <a-textarea
                :value="actField?.desc"
                :auto-size="{ minRows: 2 }"
                @change="
                  e =>
                    store.dispatch('model/saveField', { key: actField.key, desc: e.target.value })
                "
              />
            </a-descriptions-item>
          </a-descriptions>
          <template v-if="actField">
            <InputProps v-if="actField.type === 'Input'" :field="actField" />
          </template>
        </a-layout-sider>
      </a-layout>
    </div>
  </LytDesign>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, ref } from 'vue'
import LytDesign from '../layouts/LytDesign.vue'
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
    LytDesign,
    CompoCard,
    FieldCard,
    InputProps
  },
  setup() {
    const store = useStore()
    const compos = computed(() => store.getters['model/compos'] as Compo[])
    const fields = computed(() => Object.values(store.getters['model/fields']) as Field[])
    const active = ref('')
    const actField = computed(() => store.getters['model/fields'][active.value])
    const form = computed(() => store.getters['model/form'] as Form)
    const props = computed(() => (store.getters['model/ins'] as Model).props)
    const hdHeight = ref(0)

    async function onDropDown(e: DragEvent) {
      const dragCompo = e.dataTransfer?.getData('text/plain') as string
      store.dispatch('model/newField', {
        compoType: dragCompo.substring('compo_'.length)
      })
    }
    return {
      store,
      compos,
      props,
      active,
      fields,
      actField,
      compoTypes,
      form,
      hdHeight,

      onDropDown
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

.form-container {
  position: fixed;
  bottom: 30px;
  left: 70px;
  right: 70px;
}
</style>
