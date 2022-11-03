<template>
  <a-button v-if="!addMod" class="w-100" type="primary" ghost @click="onEdtLstShow">
    添加{{ label }}
  </a-button>
  <a-row v-else type="flex">
    <a-col flex="auto">
      <a-input v-if="fldNum === 1" v-model:value="addState[0]" />
      <a-input-group v-else>
        <a-row :gutter="8">
          <a-col v-for="idx of fldNum" :key="idx">
            <a-input v-model:value="addState[idx - 1]" />
          </a-col>
        </a-row>
      </a-input-group>
    </a-col>
    <a-col>
      <a-space style="height: 100%" align="center">
        <a @click="onEdtLstAdd">确定</a>
        <a @click="onEdtLstCcl">取消</a>
      </a-space>
    </a-col>
  </a-row>
  <template v-if="list && list.length">
    <a-divider style="margin: 10px 0" />
    <a-list size="small" :data-source="list">
      <template #renderItem="{ item, index }">
        <a-list-item class="p-0">
          <template #actions>
            <a @click="onEdtLstDel(index)">删除</a>
          </template>
          {{ item }}
        </a-list-item>
      </template>
    </a-list>
  </template>
</template>

<script lang="ts">
import { computed, defineComponent, reactive, ref } from 'vue'
import { setProp, getProp } from './utils'

export default defineComponent({
  name: 'EditList',
  emits: ['add', 'delete'],
  props: {
    label: { type: String, default: '项' },
    form: { type: Object, required: true },
    pkey: { type: String, required: true },
    fldNum: { type: Number, default: 1 }
  },
  setup(props, { emit }) {
    const addMod = ref(false)
    const formState = reactive(props.form)
    const addState = reactive(new Array(props.fldNum).fill(''))
    const list = computed(() => getProp(formState, props.pkey))

    function onEdtLstAdd() {
      if (!addState.every((val: string) => val)) {
        return
      }
      const item = props.fldNum === 1 ? addState[0] : Array.from(addState)
      setProp(formState, props.pkey, list.value.concat(item))
      addMod.value = false
      emit('add', props.fldNum === 1 ? addState[0] : addState)
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
      list.value.splice(index, 1)
      emit('delete', index)
    }
    return {
      addMod,
      formState,
      addState,
      list,

      onEdtLstShow,
      onEdtLstAdd,
      onEdtLstCcl,
      onEdtLstDel
    }
  }
})
</script>

<style lang="less">
.p-0 {
  padding: 0 !important;
}
</style>
