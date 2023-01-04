<template>
  <LytDesign :active="`project/${pid}/model/${mid}/form`">
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
      <a-layout-content class="p-5 w-1/2" @click="active.reset()">
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
          >
            <template v-for="(field, index) in fields" :key="field.key">
              <FieldCard
                :index="index"
                :field="field.key === active.key ? active : field"
                :active="active.key"
                :onDropDown="onFieldDropDown"
                @update:active="(act: any) => Field.copy(act, active, true)"
                @drag="(act: any) => Field.copy(act, active, true)"
              />
            </template>
          </a-form>
        </div>
      </a-layout-content>
      <a-layout-sider width="30%" class="bg-white overflow-y-auto pl-5">
        <FormProps v-if="!active.key" :form="form" />
        <FieldProps v-else :field="active" />
        <ExtraProps v-if="active.key" :field="active" :save="api.form.fields.extra.save" />
      </a-layout-sider>
    </a-layout>
  </LytDesign>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import { computed, defineComponent, onMounted, reactive, ref } from 'vue'
import LytDesign from '../layouts/LytDesign.vue'
import CompoCard from '../components/form/CompoCard.vue'
import FieldCard from '../components/form/FieldCard.vue'
import { useStore } from 'vuex'
import Field from '@lib/types/field'
import Compo from '@lib/types/compo'
import Form from '@/types/form'
import FormProps from '../components/form/FormProps.vue'
import FieldProps from '../components/form/FieldProps.vue'
import ExtraProps from '../components/form/ExtraProps.vue'
import { cmpAPI, mdlAPI as api } from '../apis'
import { useRoute } from 'vue-router'
import { BuildOutlined } from '@ant-design/icons-vue'
import { onFieldDropDown } from '../views/Form'

export default defineComponent({
  name: 'Form',
  components: {
    LytDesign,
    CompoCard,
    FieldCard,
    FormProps,
    FieldProps,
    ExtraProps,
    BuildOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const mid = route.params.mid
    const compos = reactive([] as Compo[])
    const form = computed(() => store.getters['model/form'] as Form)
    const fields = computed(() => store.getters['model/fields'] as Field[])
    const active = reactive(new Field())
    const hdHeight = ref(0)

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
    return {
      Field,

      store,
      api,
      pid,
      mid,
      compos,
      fields,
      active,
      form,
      hdHeight,

      onDropDownEmpty,
      onFieldDropDown
    }
  }
})
</script>
