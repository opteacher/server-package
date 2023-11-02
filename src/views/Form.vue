<template>
  <LytDesign :active="`/project/${pid}/model/${mid}/form`">
    <a-layout class="h-full">
      <a-layout-sider width="20%" class="bg-white overflow-y-auto pr-5">
        <div class="ant-descriptions-title mb-5">
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
      <a-layout-content class="p-5 w-1/2" @click="resetActKey">
        <div class="bg-white h-full px-7 overflow-y-auto">
          <a-empty
            v-if="!fields.length"
            class="py-7"
            description="无组件"
            @dragover="(e: any) => e.preventDefault()"
            @drop="onDropDownEmpty"
          />
          <a-form
            v-else
            class="mx-auto my-0 relative"
            :label-col="{ span: form.labelWidth + 2 }"
            :wrapper-col="{ span: 22 - form.labelWidth }"
            :label-align="form.labelAlign"
          >
            <template v-for="(field, index) in fields" :key="field.key">
              <FieldCard
                :index="index"
                :field="field.key === actKey ? actFld : field"
                :active="actKey"
                :onDropDown="onFieldDropDown"
                @update:active="onActiveChange"
                @drag="onActiveChange"
              />
            </template>
          </a-form>
        </div>
      </a-layout-content>
      <a-layout-sider width="30%" class="bg-white overflow-y-auto pl-5">
        <FormProps v-if="!actKey" :form="form" @update:form="api.form.save" />
        <FieldProps v-else :field="actFld" @update:field="api.form.fields.save" />
        <ExtraProps
          v-if="actKey"
          :fld-key="actKey"
          :extra="actFld.extra"
          :compo="actCmp"
          @update:extra="api.form.fields.extra.save"
        />
      </a-layout-sider>
    </a-layout>
  </LytDesign>
</template>

<script lang="ts" setup name="Form">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Form from '@/types/form'
import { BuildOutlined } from '@ant-design/icons-vue'
import Compo from '@lib/types/compo'
import Field from '@lib/types/field'
import { computed, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'

import { mdlAPI as api, cmpAPI } from '../apis'
import CompoCard from '../components/form/CompoCard.vue'
import ExtraProps from '../components/form/ExtraProps.vue'
import FieldCard from '../components/form/FieldCard.vue'
import FieldProps from '../components/form/FieldProps.vue'
import FormProps from '../components/form/FormProps.vue'
import LytDesign from '../layouts/LytDesign.vue'
import { onFieldDropDown } from '../views/Form'
import { useRoute } from 'vue-router'

const store = useStore()
const route = useRoute()
const pid = route.params.pid
const mid = route.params.mid
const compos = reactive<Compo[]>([])
const form = computed<Form>(() => store.getters['model/form'])
const fields = computed<Field[]>(() => store.getters['model/fields'])
const actFld = computed<Field>(
  () => store.getters['model/fields'].find((fld: Field) => fld.key === actKey.value) || new Field()
)
const actKey = ref('')
const actCmp = ref(new Compo())

onMounted(async () => {
  compos.splice(0, compos.length, ...(await cmpAPI.all()))
  await store.dispatch('model/refresh')
})

async function onDropDownEmpty(e: DragEvent) {
  if (!e.dataTransfer) {
    return
  }
  const dragCompo = e.dataTransfer.getData('text/plain') as string
  await api.form.fields.add({
    compoType: dragCompo.substring('compo_'.length)
  })
}
function onActiveChange(field: any) {
  actKey.value = field.key
  actCmp.value = compos.find(cmp => cmp.name === actFld.value.ftype) || new Compo()
}
function resetActKey() {
  actKey.value = ''
}
</script>
