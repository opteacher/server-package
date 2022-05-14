<template>
  <LytDesign :active="`project/${pid}/model/${mid}/form`">
    <a-layout class="h-100">
      <a-layout-sider width="20%" class="white-bkgd vertical-scroll pr-20">
        <div class="ant-descriptions-title mb-20">
          <build-outlined />
          &nbsp;组件
        </div>
        <a-list :grid="{ gutter: 16, column: 2 }" :data-source="compos">
          <template #renderItem="{ item: compo }">
            <a-list-item>
              <CompoCard :compo="compo" />
            </a-list-item>
          </template>
        </a-list>
      </a-layout-sider>
      <a-layout-content class="main-panel" @click="active = new Field()">
        <div
          class="white-bkgd h-100"
          @dragover.stop="e => e.preventDefault()"
          @drop.stop="onDropDown"
        >
          <a-empty
            class="ptb-30"
            v-if="!fields.length"
            description="无组件"
            @dragover="e => e.preventDefault()"
            @drop="onDropDownEmpty"
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
                :active="active.key"
                :onDropDown="onDropDown"
                @update:active="act => (active = act)"
                @drag="act => (active = act)"
              />
            </template>
          </a-form>
        </div>
      </a-layout-content>
      <a-layout-sider width="30%" class="white-bkgd vertical-scroll pl-20">
        <FormProps v-if="!active.key" :form="form" />
        <FieldProps v-else :field="active" />
        <template v-if="active.key">
          <InputProps v-if="active.ftype === 'Input'" :field="active" />
          <SelectProps v-else-if="active.ftype === 'Select'" :field="active" />
        </template>
      </a-layout-sider>
    </a-layout>
  </LytDesign>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, onMounted, ref } from 'vue'
import LytDesign from '../layouts/LytDesign.vue'
import CompoCard from '../components/form/CompoCard.vue'
import FieldCard from '../components/form/FieldCard.vue'
import { compoTypes } from '../types'
import { useStore } from 'vuex'
import Field from '@/types/field'
import Compo from '@/types/compo'
import Form from '@/types/form'
import FormProps from '../components/form/FormProps.vue'
import FieldProps from '../components/form/FieldProps.vue'
import InputProps from '../components/form/InputProps.vue'
import SelectProps from '../components/form/SelectProps.vue'
import { mdlAPI as api } from '../apis'
import { useRoute } from 'vue-router'
import { BuildOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'Form',
  components: {
    LytDesign,
    CompoCard,
    FieldCard,
    FormProps,
    FieldProps,
    InputProps,
    SelectProps,
    BuildOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const mid = route.params.mid
    const compos = computed(() => store.getters['model/compos'] as Compo[])
    const form = computed(() => store.getters['model/form'] as Form)
    const fields = computed(() => store.getters['model/fields'] as Field[])
    const active = ref(new Field())
    const hdHeight = ref(0)

    onMounted(() => store.dispatch('model/refresh'))

    async function onDropDownEmpty(e: DragEvent) {
      const dragCompo = e.dataTransfer?.getData('text/plain') as string
      await api.form.fields.add({
        compoType: dragCompo.substring('compo_'.length)
      })
    }
    function onDropDown(e: DragEvent) {
      e.preventDefault()
      const instPos = (
        store.getters['model/dragOn'].startsWith('divider')
          ? store.getters['model/dragOn']
          : store.getters['model/divider']
      ).split('_')
      if (instPos.length !== 3) {
        return
      }
      const dragField = e.dataTransfer?.getData('text/plain') as string
      const insertPos = {
        field: instPos[2],
        pos: instPos[1] === 'top' ? 'before' : ('after' as 'before' | 'after')
      }
      if (dragField?.startsWith('compo_')) {
        api.form.fields.add({
          compoType: dragField.substring('compo_'.length),
          insertPos
        })
      } else {
        api.form.fields.insert({ dragField, insertPos })
      }
    }
    return {
      Field,

      store,
      pid,
      mid,
      compos,
      fields,
      active,
      compoTypes,
      form,
      hdHeight,

      onDropDownEmpty,
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
