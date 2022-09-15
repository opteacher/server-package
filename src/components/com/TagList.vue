<template>
  <template v-for="item in valState" :key="item">
    <a-tag closable @close="onRmvTagClick(item)">
      {{ fldState.lvMapper[item] || item }}
    </a-tag>
  </template>
  <a-button type="dashed" size="small" @click="onNewTagClick">
    <template #icon><plus-outlined /></template>
    添加
  </a-button>
  <slot name="FormDialog" />
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { ndAPI as api } from '@/apis'

export default defineComponent({
  name: 'TagList',
  components: {
    PlusOutlined
  },
  emits: ['update:value'],
  props: {
    field: { type: Object, required: true },
    value: { type: Array, required: true }
  },
  setup(props) {
    const valState = reactive(props.value as any[])
    const fldState = reactive(props.field)

    function onNewTagClick() {
      fldState.show = true
      fldState.emitter.emit('update:data', valState)
    }
    async function onRmvTagClick(key: any) {
      valState.splice(valState.indexOf(key), 1)
      await api.deps.save(valState)
    }
    return {
      valState,
      fldState,

      onNewTagClick,
      onRmvTagClick
    }
  }
})
</script>
