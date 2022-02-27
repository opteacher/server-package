<template>
  <a-input placeholder="输入颜色代码" :value="color">
    <template #suffix>
      <div
        :style="{
          width: '20px',
          height: '20px',
          cursor: 'pointer',
          border: '1px solid black',
          'background-color': color
        }"
        @click="
          () => {
            formState.visible = true
            formState.color = color
          }
        "
      />
      <a-modal
        :bodyStyle="{ padding: 0 }"
        v-model:visible="formState.visible"
        title="选择颜色"
        @ok="onSubmit"
      >
        <ColorSelect :color="color" @update:color="color => (formState.color = color)" />
      </a-modal>
    </template>
  </a-input>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import ColorSelect from './com/ColorSelect.vue'

export default defineComponent({
  name: 'ColorField',
  components: {
    ColorSelect
  },
  emits: ['submit'],
  props: {
    color: { type: String, default: '' }
  },
  setup(_props, { emit }) {
    const formState = reactive({
      visible: false,
      color: '#000000'
    })

    function onSubmit() {
      emit('submit', {
        color: formState.color,
        next: () => {
          formState.visible = false
        }
      })
    }
    return {
      formState,
      onSubmit
    }
  }
})
</script>
