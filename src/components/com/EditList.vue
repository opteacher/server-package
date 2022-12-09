<template>
  <a-button v-if="!addMod" class="w-full" type="primary" ghost @click="onEdtLstShow">
    添加{{ label }}
  </a-button>
  <a-row v-else type="flex" :gutter="8">
    <a-col flex="auto">
      <template v-if="fldNum === 1">
        <a-select
          v-if="field.modes[0] === 'select'"
          :options="field.options"
          v-model:value="addState[0]"
        />
        <a-input v-else v-model:value="addState[0]" />
      </template>
      <a-input-group v-else>
        <a-row :gutter="8">
          <a-col v-for="idx of fldNum" :key="idx">
            <a-select
              v-if="field.modes[idx] === 'select'"
              :options="field.options"
              v-model:value="addState[idx]"
            />
            <a-input v-else v-model:value="addState[idx]" />
          </a-col>
        </a-row>
      </a-input-group>
    </a-col>
    <a-col>
      <a-space class="h-full" align="center">
        <a class="hover:text-primary" @click="onEdtLstAdd">确定</a>
        <a class="hover:text-secondary" @click="onEdtLstCcl">取消</a>
      </a-space>
    </a-col>
  </a-row>
  <template v-if="list && list.length">
    <a-divider class="my-2.5 mx-0" />
    <a-list size="small" :data-source="list">
      <template #renderItem="{ item, index }">
        <a-list-item class="p-0">
          <template #actions>
            <a class="hover:text-error" @click="onEdtLstDel(index)">删除</a>
          </template>
          {{ opnMap[item] || item }}
        </a-list-item>
      </template>
    </a-list>
  </template>
</template>

<script lang="ts">
import ARow from 'ant-design-vue/lib/grid/Row'
import list from 'ant-design-vue/lib/list'
import { computed, defineComponent, reactive, ref } from 'vue'

export default defineComponent({
  name: 'EditList',
  emits: ['update:value'],
  props: {
    label: { type: String, default: '项' },
    value: { type: Array, required: true },
    field: { type: Object, required: true }
  },
  setup(props, { emit }) {
    const addMod = ref(false)
    const fldNum = computed(() => props.field.modes.length)
    const addState = reactive(new Array(fldNum.value).fill(''))
    const list = reactive(props.value)
    const opnMap = computed(() =>
      props.field.options
        ? Object.fromEntries(props.field.options.map((opn: any) => [opn.value, opn.label]))
        : {}
    )

    function onEdtLstAdd() {
      if (!addState.every((val: string) => val)) {
        return
      }
      const item = fldNum.value === 1 ? addState[0] : Array.from(addState)
      list.push(item)
      addMod.value = false
      emit('update:value', list)
    }
    function onEdtLstCcl() {
      addState.fill('')
      addMod.value = false
    }
    function onEdtLstShow() {
      addState.fill('')
      addMod.value = true
    }
    function onEdtLstDel(index: number) {
      list.splice(index, 1)
      emit('update:value', list)
    }
    return {
      fldNum,
      addMod,
      addState,
      list,
      opnMap,

      onEdtLstShow,
      onEdtLstAdd,
      onEdtLstCcl,
      onEdtLstDel
    }
  }
})
</script>
