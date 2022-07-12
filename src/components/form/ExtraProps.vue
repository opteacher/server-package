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
      <template v-else-if="exField.ftype === 'List'">
        <a-button class="w-100" @click="addItem = true">添加{{ exField.label }}</a-button>
        <a-form
          v-if="addItem"
          class="mt-24"
          :model="itemState"
          @finish="(item: any) => edtField.extra.options.push(item)"
        >
          <a-form-item v-for="(value, key) in exField.extra.mapper" :key="key">
            <a-input
              v-model:value="itemState[key]"
              :placeholder="value.placeholder || `请输入${value.label}`"
            />
          </a-form-item>
          <a-form-item>
            <a-button type="primary" html-type="submit">确认</a-button>
            <a-button style="margin-left: 10px" @click="addItem = false">取消</a-button>
          </a-form-item>
        </a-form>
        <a-list
          v-show="edtField.extra.options"
          style="margin-top: 5px"
          size="small"
          :data-source="edtField.extra.options"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              {{ item }}
            </a-list-item>
          </template>
        </a-list>
      </template>
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Field from '@/types/field'
import { computed, defineComponent, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import IconField from '../com/IconField.vue'

export default defineComponent({
  components: {
    IconField
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
    const addItem = ref(false)
    const itemState = reactive({} as Record<string, string>)

    return {
      edtField,
      cmpExtra,
      addItem,
      itemState
    }
  }
})
</script>
