<template>
  <a-form-item :rules="field.rules">
    <template v-if="field.label" #label>
      {{ field.label }}&nbsp;
      <a-tooltip v-if="field.desc">
        <template #title>{{ field.desc }}</template>
        <InfoCircleOutlined style="color: #1890ff" />
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
        {{ formState[field.refer] }}
      </template>
      <template v-else-if="field.ftype === 'Textarea'">
        <pre>{{ formState[field.refer] }}</pre>
      </template>
      <template v-else-if="field.ftype === 'Select' || field.ftype === 'Cascader'">
        {{ fmtDrpdwnValue(field.extra.options, formState[field.refer]) }}
      </template>
      <template v-else-if="field.ftype === 'Checkbox'">
        {{ formState[field.refer] ? '是' : '否' }}
      </template>
      <template v-else-if="field.ftype === 'Table'">
        <a-table
          :columns="field.extra.columns"
          :data-source="formState[field.refer]"
          :pagination="false"
          size="small"
        />
      </template>
    </template>
    <template v-else>
      <a-input
        v-if="field.ftype === 'Input'"
        v-model:value="formState[field.refer]"
        :placeholder="field.placeholder"
      />
      <a-input-password
        v-if="field.ftype === 'Password'"
        v-model:value="formState[field.refer]"
        :placeholder="field.placeholder"
      />
      <template v-else-if="field.ftype === 'Checkbox'">
        <template v-if="field.extra.mult">
          <template v-for="option in field.extra.options" :key="option.value">
            <a-checkable-tag
              v-if="field.extra.style === 'tag'"
              :checked="mulChkChecked(option)"
              @change="(checked: boolean) => onMulChkCheck(option, checked)"
            >
              {{ option.label }}
            </a-checkable-tag>
            <a-checkbox
              v-else
              :checked="mulChkChecked(option)"
              @change="(e: any) => onMulChkCheck(option, e.target.checked)"
            >
              {{ option.label }}
            </a-checkbox>
          </template>
        </template>
        <template v-else>
          <template v-if="field.extra.style === 'button'">
            <a-button
              class="w-100"
              :ghost="formState[field.refer]"
              @click="
                () => {
                  formState[field.refer] = !formState[field.refer]
                }
              "
            >
              {{ field.placeholder }}
            </a-button>
          </template>
          <template v-else-if="field.extra.style === 'switch'">
            <a-switch v-model:checked="formState[field.refer]" />
            {{ field.placeholder }}
          </template>
          <a-checkbox v-else v-model:checked="formState[field.refer]">
            {{ field.placeholder }}
          </a-checkbox>
        </template>
      </template>
      <a-select
        v-else-if="field.ftype === 'Select'"
        class="w-100"
        v-model:value="formState[field.refer]"
        :placeholder="field.placeholder"
      />
      <a-input-number
        v-else-if="field.ftype === 'Number'"
        class="w-100"
        v-model:value="formState[field.refer]"
        :placeholder="field.placeholder"
      />
      <a-date-picker
        v-else-if="field.ftype === 'DateTime'"
        class="w-100"
        v-model:value="formState[field.refer]"
        :placeholder="field.placeholder"
        show-time
      />
    </template>
  </a-form-item>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import Field from '@/types/field'
import { OpnType } from '@/types'
import { InfoCircleOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'DmFormItem',
  emits: ['change'],
  components: {
    InfoCircleOutlined
  },
  props: {
    field: { type: Field, required: true },
    form: { type: Object, required: true },
    viewOnly: { type: Boolean, default: false }
  },
  setup(props) {
    const formState = reactive(props.form)

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
    function mulChkChecked(option: OpnType) {
      if (formState[props.field.refer]) {
        return formState[props.field.refer].includes(option.value)
      } else {
        return false
      }
    }
    function onMulChkCheck(option: OpnType, checked: boolean) {
      if (typeof formState[props.field.refer] === 'undefined') {
        formState[props.field.refer] = []
      }
      const array = formState[props.field.refer]
      if (checked) {
        if (!array.includes(option.value)) {
          array.push(option.value)
        }
      } else {
        const index = array.indexOf(option.value)
        if (index !== -1) {
          array.splice(index, 1)
        }
      }
    }
    return {
      formState,

      fmtDrpdwnValue,
      mulChkChecked,
      onMulChkCheck
    }
  }
})
</script>
