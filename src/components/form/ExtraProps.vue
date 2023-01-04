<template>
  <a-descriptions class="my-0.5" title="组件附加参数" :column="1" bordered size="small">
    <a-descriptions-item v-for="exField in cmpExtra" :key="exField.key" :label="exField.label">
      <a-input
        v-if="exField.ftype === 'Input'"
        v-model:value="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        @blur="(e: any) => save(edtField.key, { [exField.refer]: e.target.value })"
      />
      <a-input-number
        v-else-if="exField.ftype === 'Number'"
        class="w-full"
        v-model:value="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        @blur="(e: any) => save(edtField.key, { [exField.refer]: e.target.value })"
      />
      <a-textarea
        v-else-if="exField.ftype === 'Textarea'"
        v-model:value="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        @blur="(e: any) => save(edtField.key, { [exField.refer]: e.target.value })"
      />
      <a-select
        v-else-if="exField.ftype === 'Select'"
        class="w-full"
        v-model:value="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        :options="exField.extra.options"
        @change="(value: any) => save(edtField.key, { [exField.refer]: value })"
      />
      <a-cascader
        v-else-if="exField.ftype === 'Cascader'"
        class="w-full"
        v-model:value="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        :options="exField.extra.options"
        @change="(value: any) => save(edtField.key, { [exField.refer]: value })"
      />
      <a-checkbox
        v-else-if="exField.ftype === 'Checkbox'"
        v-model:checked="edtField.extra[exField.refer]"
        @change="(e: any) => save(edtField.key, { [exField.refer]: e.target.checked })"
      />
      <a-switch
        v-else-if="exField.ftype === 'Switch'"
        v-model:checked="edtField.extra[exField.refer]"
        @change="(value: boolean) => save(edtField.key, { [exField.refer]: value })"
      />
      <IconField
        v-else-if="exField.ftype === 'IconField'"
        :icon="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        @select="(icon: string) => save(edtField.key, { [exField.refer]: icon })"
      />
      <EditList
        v-else-if="exField.ftype === 'EditList'"
        :field="edtField"
        :exField="exField"
        @addItem="save(edtField.key, pickOrIgnore(edtField.extra, [exField.refer], false))"
        @rmvItem="save(edtField.key, pickOrIgnore(edtField.extra, [exField.refer], false))"
      />
    </a-descriptions-item>
    <slot />
  </a-descriptions>
</template>

<script lang="ts">
import Field from '@lib/types/field'
import { computed, defineComponent, onMounted, reactive, watch } from 'vue'
import { pickOrIgnore } from '@/utils'
import { cmpAPI } from '@/apis'
import Compo from '@lib/types/compo'

export default defineComponent({
  props: {
    field: { type: Field, required: true },
    save: { type: Function, required: true },
    compo: { type: Compo, default: new Compo() }
  },
  setup(props) {
    const edtField = reactive(props.field)
    const cmpState = reactive(props.compo)
    const cmpExtra = computed(() => (cmpState.key ? cmpState.props : []))

    watch(() => props.field.key, refresh)
    onMounted(refresh)

    async function refresh() {
      let compo = props.compo
      if (!props.compo.key) {
        const result = await cmpAPI.all({ name: props.field.ftype })
        if (!result.length) {
          cmpState.reset()
          return
        }
        compo = result[0]
      }
      Compo.copy(compo, cmpState)
    }
    return {
      edtField,
      cmpExtra,

      pickOrIgnore
    }
  }
})
</script>
