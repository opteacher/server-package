<template>
  <a-descriptions v-if="cmpExtra.length" title="组件附加参数" :column="1" bordered size="small">
    <a-descriptions-item v-for="exField in cmpExtra" :key="exField.key" :label="exField.label">
      <a-input
        v-if="exField.ftype === 'Input'"
        v-model:value="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        @blur="(e: any) => save(edtField.key, { [exField.refer]: e.target.value })"
      />
      <a-input-number
        v-else-if="exField.ftype === 'Number'"
        class="w-100"
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
        class="w-100"
        v-model:value="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        :options="exField.extra.options"
        @change="(value: any) => save(edtField.key, { [exField.refer]: value })"
      />
      <a-cascader
        v-else-if="exField.ftype === 'Cascader'"
        class="w-100"
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
        v-else-if="exField.ftype === 'Icon'"
        :icon="edtField.extra[exField.refer]"
        :placeholder="exField.placeholder"
        @select="(icon: string) => save(edtField.key, { [exField.refer]: icon })"
      />
      <EditableList
        v-else-if="exField.ftype === 'List'"
        :field="edtField"
        :exField="exField"
        @addItem="save(edtField.key, pickOrIgnore(edtField.extra, [exField.refer], false))"
        @rmvItem="save(edtField.key, pickOrIgnore(edtField.extra, [exField.refer], false))"
      />
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Field from '@/types/field'
import { computed, defineComponent, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import IconField from '../com/IconField.vue'
import EditableList from '../com/EditableList.vue'
import { pickOrIgnore } from '@/utils'

export default defineComponent({
  components: {
    IconField,
    EditableList
  },
  props: {
    field: { type: Field, required: true },
    save: { type: Function, required: true }
  },
  setup(props) {
    const store = useStore()
    const edtField = reactive(props.field)
    const cmpExtra = computed(() => {
      const compo = store.getters['model/compos'].find(({ name }: any) => name === edtField.ftype)
      return compo && compo.extra ? compo.extra.map((field: any) => Field.copy(field)) : []
    })

    return {
      edtField,
      cmpExtra,

      pickOrIgnore
    }
  }
})
</script>
