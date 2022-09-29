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
  <div
    v-show="edtField.extra.options && edtField.extra.options.length"
    class="mt-20 mb-10 br-4 b-1 pos-rel"
    :class="{ 'p-5': expanded }"
  >
    <a-button
      type="link"
      class="pos-abs white-bkgd"
      :style="{ left: '-12px', top: '-12px' }"
      size="small"
      @click="expanded = !expanded"
    >
      <template #icon>
        <minus-outlined v-if="expanded" style="font-size: 8pt" />
        <plus-outlined v-else style="font-size: 8pt" />
      </template>
    </a-button>
    <a-list v-if="expanded" size="small" :data-source="edtField.extra.options">
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
  </div>
</template>

<script lang="ts">
import Field from '@/types/field'
import { defineComponent, reactive, ref } from 'vue'
import { DeleteOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'EditableList',
  emits: ['addItem', 'rmvItem'],
  components: {
    DeleteOutlined,
    PlusOutlined,
    MinusOutlined
  },
  props: {
    field: { type: Field, required: true },
    exField: { type: Field, required: true }
  },
  setup(props, { emit }) {
    const edtField = reactive(props.field)
    const addItem = ref(false)
    const itemState = reactive({} as Record<string, string>)
    const expanded = ref(true)

    function onItemAdd(item: any) {
      if (!edtField.extra.options) {
        edtField.extra.options = [item]
      } else {
        edtField.extra.options.push(item)
      }
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
      expanded,

      onItemAdd,
      onItemRmv
    }
  }
})
</script>
