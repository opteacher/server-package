<template>
  <a-form-item :name="field.refer" :rules="field.rules">
    <template v-if="field.label" #label>
      {{ field.label }}&nbsp;
      <a-tooltip v-if="field.desc">
        <template #title>{{ field.desc }}</template>
        <InfoCircleOutlined class="text-primary" />
      </a-tooltip>
    </template>
    <template v-if="viewOnly">
      <template
        v-if="
          field.ftype === 'Input' ||
          field.ftype === 'Number' ||
          field.ftype === 'Delable' ||
          field.ftype === 'SelOrIpt' ||
          field.ftype === 'DateTime'
        "
      >
        {{ form[field.refer] }}
      </template>
      <template v-else-if="field.ftype === 'Textarea'">
        <pre>{{ form[field.refer] }}</pre>
      </template>
      <template v-else-if="field.ftype === 'Select' || field.ftype === 'Cascader'">
        {{ fmtDrpdwnValue(field.extra.options, form[field.refer]) }}
      </template>
      <template v-else-if="field.ftype === 'Checkbox'">
        {{ form[field.refer] ? '是' : '否' }}
      </template>
      <template v-else-if="field.ftype === 'Table'">
        <a-table
          :columns="field.extra.columns"
          :data-source="form[field.refer]"
          :pagination="false"
          size="small"
        />
      </template>
    </template>
    <template v-else>
      <a-input
        v-if="field.ftype === 'Input'"
        v-model:value="form[field.refer]"
        :placeholder="field.extra.placeholder || ''"
      />
      <a-input-password
        v-if="field.ftype === 'Password'"
        v-model:value="form[field.refer]"
        :placeholder="field.extra.placeholder || ''"
      />
      <a-checkbox v-else-if="field.ftype === 'Checkbox'" v-model:checked="form[field.refer]" />
      <a-select
        v-else-if="field.ftype === 'Select'"
        class="w-100"
        :options="field.extra.options"
        v-model:value="form[field.refer]"
        :placeholder="field.extra.placeholder || ''"
      />
      <a-input-number
        v-else-if="field.ftype === 'Number'"
        class="w-100"
        v-model:value="form[field.refer]"
        :placeholder="field.extra.placeholder || ''"
      />
    </template>
  </a-form-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Field from '@lib/types/field'
import { OpnType } from '../types'
import { InfoCircleOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'FormItem',
  emits: ['change'],
  components: {
    InfoCircleOutlined
  },
  props: {
    field: { type: Field, required: true },
    form: { type: Object, required: true },
    viewOnly: { type: Boolean, default: false }
  },
  setup() {
    function fmtDrpdwnValue(options: OpnType[], value: any | any[]) {
      if (value instanceof Array) {
        const vals = []
        if (!options || !options.length) {
          return value.join(' / ')
        }
        let opns = options
        for (let i = 0; i < value.length; ++i) {
          const opn = opns.find((opn: OpnType) => opn.value === value[i])
          if (opn) {
            opns = opn.children as OpnType[]
            vals.push(opn.label || opn.value)
          } else {
            vals.push(value[i])
          }
          if (i === value.length - 1) {
            break
          }
        }
        return vals.join(' / ')
      } else {
        const opn = options.find((opn: OpnType) => opn.value === value)
        return opn ? opn.label || opn.value : value
      }
    }
    return {
      fmtDrpdwnValue
    }
  }
})
</script>
