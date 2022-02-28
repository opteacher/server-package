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
          <FormProps v-if="!actField" :form="form" />
          <FieldProps v-else :field="actField" />
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
import FormProps from '../components/FormProps.vue'
import FieldProps from '../components/FieldProps.vue'
import InputProps from '../components/InputProps.vue'

export default defineComponent({
  name: 'Form',
  components: {
    LytDesign,
    CompoCard,
    FieldCard,
    FormProps,
    FieldProps,
    InputProps
  },
  setup() {
    const store = useStore()
    const compos = computed(() => store.getters['model/compos'] as Compo[])
    const fields = computed(() => Object.values(store.getters['model/fields']) as Field[])
    const active = ref('')
    const actField = computed(() => store.getters['model/fields'][active.value])
    const form = computed(() => store.getters['model/form'] as Form)
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
