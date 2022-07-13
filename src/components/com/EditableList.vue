<template>
  <a-button v-if="!addItem" class="w-100" @click="addItem = true">添加{{ exField.label }}</a-button>
  <a-form v-else :model="itemState" @finish="onItemAdd">
    <a-form-item v-for="(value, key) in exField.extra.mapper" :key="key" :name="key" class="mb-10">
      <a-input
        v-model:value="itemState[key]"
        :placeholder="value.placeholder || `请输入${value.label}`"
      />
    </a-form-item>
    <a-form-item class="mb-0">
      <a-button type="primary" html-type="submit">确认</a-button>
      <a-button class="ml-10" @click="addItem = false">取消</a-button>
    </a-form-item>
  </a-form>
  <a-list
    v-show="edtField.extra.options && edtField.extra.options.length"
    class="mt-5"
    size="small"
    :data-source="edtField.extra.options"
  >
    <template #renderItem="{ item, index }">
      <a-list-item>
        <template #actions>
          <a-button danger type="link" @click="onItemRmv(index)">
            <template #icon><delete-outlined /></template>
          </a-button>
        </template>
        <a-list-item-meta :description="exField.extra.desc ? item[exField.extra.desc] : ''">
          <template #title>
            {{ exField.extra.title ? item[exField.extra.title] : item }}
          </template>
        </a-list-item-meta>
      </a-list-item>
    </template>
  </a-list>
</template>

<script lang="ts">
import Field from '@/types/field'
import { defineComponent, reactive, ref } from 'vue'
import { DeleteOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'EditableList',
  emits: ['addItem', 'rmvItem'],
  components: { DeleteOutlined },
  props: {
    field: { type: Field, required: true },
    exField: { type: Field, required: true }
  },
  setup(props, { emit }) {
    const edtField = reactive(props.field)
    const addItem = ref(false)
    const itemState = reactive({} as Record<string, string>)

    function onItemAdd(item: any) {
      if (!edtField.extra.options) {
        edtField.extra.options = [item]
      } else {
        edtField.extra.options.push(item)
      }
      console.log(edtField.extra)
      addItem.value = false
      emit('addItem', item)
    }
    function onItemRmv(index: number) {
      edtField.extra.options.splice(index, 1)
      emit('rmvItem', index)
    }
    return {
      edtField,
      addItem,
      itemState,

      onItemAdd,
      onItemRmv
    }
  }
})
</script>
