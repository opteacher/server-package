<template>
  <a-descriptions title="多选组件参数" :column="1" bordered size="small">
    <a-descriptions-item label="多选">
      <a-checkbox v-model:checked="edtField.extra.mult" @change="onMultChange" />
    </a-descriptions-item>
    <a-descriptions-item label="风格">
      <a-select
        class="w-100"
        :options="edtField.extra.mult ? mulStyles : sglStyles"
        v-model:value="edtField.extra.style"
        @change="(style: string) => api.form.fields.extra.save(edtField.key, { style })"
      />
    </a-descriptions-item>
    <a-descriptions-item label="选项" v-if="edtField.extra.mult">
      <a-button class="w-100 mb-5" type="primary" ghost @click="onEdtLstShow">添加</a-button>
      <template v-if="addMod">
        <a-row class="mb-5">
          <a-col :span="18">
            <a-input v-model:value="editing.label" placeholder="输入标签" />
          </a-col>
          <a-col class="text-right" :span="6">
            <a-button type="link" @click="onEdtLstAdded">确定</a-button>
          </a-col>
        </a-row>
        <a-row class="mb-5">
          <a-col :span="18">
            <a-input v-model:value="editing.value" placeholder="输入值" />
          </a-col>
          <a-col class="text-right" :span="6">
            <a-button type="link" danger @click="onEdtLstCanceled">取消</a-button>
          </a-col>
        </a-row>
      </template>
      <a-list
        v-show="options.length"
        style="margin-top: 5px"
        size="small"
        :data-source="options"
        bordered
      >
        <template #renderItem="{ item, index }">
          <a-list-item>
            <template #actions>
              <a-popconfirm
                title="确定删除该项吗？"
                ok-text="确定"
                cancel-text="取消"
                @confirm="onEdtLstDeleted(index)"
              >
                <a-button type="link" danger size="small">删除</a-button>
              </a-popconfirm>
            </template>
            <a-list-item-meta :description="item.value">
              <template #title>{{ item.label }}</template>
            </a-list-item-meta>
          </a-list-item>
        </template>
      </a-list>
    </a-descriptions-item>
  </a-descriptions>
</template>

<script lang="ts">
import Field from '@/types/field'
import { defineComponent, onMounted, reactive, ref } from 'vue'
import { OpnType } from '@/types'
import { mdlAPI as api } from '@/apis'

const sglStyles = [
  { label: '多选风格', value: 'checkbox' },
  { label: '开关风格', value: 'switch' },
  { label: '按钮风格', value: 'button' }
]

const mulStyles = [
  { label: '多选风格', value: 'checkbox' },
  { label: '标签风格', value: 'tag' }
]

export default defineComponent({
  name: 'CheckBoxProps',
  props: {
    field: { type: Field, required: true }
  },
  setup(props) {
    const addMod = ref(false)
    const edtField = reactive(props.field)
    const editing = reactive({ label: '', value: '' } as OpnType)
    const options = reactive(props.field.extra.options || [])

    onMounted(() => {
      if (typeof edtField.extra.mult === 'undefined') {
        edtField.extra.mult = false
      }
      if (typeof edtField.extra.style === 'undefined') {
        edtField.extra.style = 'checkbox'
      }
    })

    function onEdtLstShow() {
      addMod.value = true
    }
    async function onEdtLstAdded() {
      await api.form.fields.extra.save(edtField.key, {
        options: options.concat(editing)
      })
      options.push({ label: editing.label, value: editing.value })
      onEdtLstCanceled()
    }
    function onEdtLstCanceled() {
      editing.label = ''
      editing.value = ''
      addMod.value = false
    }
    async function onEdtLstDeleted(index: number) {
      options.splice(index, 1)
      await api.form.fields.extra.save(edtField.key, { options })
    }
    async function onMultChange(e: any) {
      await api.form.fields.extra.save(edtField.key, { mult: e.target.checked, style: 'checkbox' })
      edtField.extra.style = 'checkbox'
    }
    return {
      api,
      addMod,
      edtField,
      editing,
      options,
      sglStyles,
      mulStyles,

      onEdtLstShow,
      onEdtLstAdded,
      onEdtLstCanceled,
      onEdtLstDeleted,
      onMultChange
    }
  }
})
</script>
