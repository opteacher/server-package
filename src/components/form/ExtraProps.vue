<template>
  <a-descriptions class="my-0.5" title="组件附加参数" :column="1" bordered size="small">
    <a-descriptions-item v-for="exField in compo.props" :key="exField.key" :label="exField.label">
      <a-input
        v-if="exField.ftype === 'Input'"
        :value="extraState[exField.refer]"
        :placeholder="exField.placeholder"
        @blur="(e: any) => emit('update:extra', fldKey, { [exField.refer]: e.target.value })"
      />
      <a-input-number
        v-else-if="exField.ftype === 'Number'"
        class="w-full"
        :value="extraState[exField.refer]"
        :placeholder="exField.placeholder"
        @blur="(e: any) => emit('update:extra', fldKey, { [exField.refer]: e.target.value })"
      />
      <a-textarea
        v-else-if="exField.ftype === 'Textarea'"
        :value="extraState[exField.refer]"
        :placeholder="exField.placeholder"
        @blur="(e: any) => emit('update:extra', fldKey, { [exField.refer]: e.target.value })"
      />
      <a-select
        v-else-if="exField.ftype === 'Select'"
        class="w-full"
        :value="extraState[exField.refer]"
        :placeholder="exField.placeholder"
        :options="exField.extra.options"
        @change="(value: any) => emit('update:extra', fldKey, { [exField.refer]: value })"
      />
      <a-cascader
        v-else-if="exField.ftype === 'Cascader'"
        class="w-full"
        :value="extraState[exField.refer]"
        :placeholder="exField.placeholder"
        :options="exField.extra.options"
        @change="(value: any) => emit('update:extra', fldKey, { [exField.refer]: value })"
      />
      <a-checkbox
        v-else-if="exField.ftype === 'Checkbox'"
        :checked="extraState[exField.refer]"
        @change="(e: any) => emit('update:extra', fldKey, { [exField.refer]: e.target.checked })"
      />
      <a-switch
        v-else-if="exField.ftype === 'Switch'"
        :checked="extraState[exField.refer]"
        @change="(value: boolean) => emit('update:extra', fldKey, { [exField.refer]: value })"
      />
      <IconField
        v-else-if="exField.ftype === 'IconField'"
        :icon="extraState[exField.refer]"
        :placeholder="exField.placeholder"
        @select="(icon: string) => emit('update:extra', fldKey, { [exField.refer]: icon })"
      />
      <EditList
        v-else-if="exField.ftype === 'EditList'"
        :value="extraState[exField.refer]"
        :mapper="
          Object.assign(exField.extra, {
            mapper: new Mapper(exField.extra.mapper),
            newFun: code2Func(exField.extra.newFun)
          })
        "
        @update:value="
          emit('update:extra', fldKey, pickOrIgnore(extraState, [exField.refer], false))
        "
      >
        <template #formItem="{ form, elKey, value }">
          <FormItem
            :form="form"
            :skey="elKey"
            :mapper="value"
            @update:fprop="(values: any) => Object.entries(values).map(([k, v]) => setProp(form, k, v))"
          />
        </template>
      </EditList>
    </a-descriptions-item>
    <slot />
  </a-descriptions>
</template>

<script lang="ts" setup>
import { code2Func, pickOrIgnore, setProp } from '@/utils'
import Compo from '@lib/types/compo'
import Mapper from '@lib/types/mapper'
import { cloneDeep } from 'lodash'
import { onMounted, ref, watch } from 'vue'

const props = defineProps({
  fldKey: { type: String, required: true },
  extra: { type: Object, required: true },
  compo: { type: Compo, default: new Compo() }
})
const emit = defineEmits(['update:extra'])
const extraState = ref<Record<string, any>>({})

onMounted(refresh)
watch(() => props.extra, refresh)

function refresh() {
  extraState.value = cloneDeep(props.extra)
}
</script>
