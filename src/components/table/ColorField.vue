<template>
  <a-input placeholder="输入颜色代码" :value="color" :size="size">
    <template #suffix>
      <div
        :style="{
          width: `${colDspSz}px`,
          height: `${colDspSz}px`,
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
        <ColorSelect :color="color" @update:color="(color: string) => (formState.color = color)" />
      </a-modal>
    </template>
  </a-input>
</template>

<script lang="ts">
import { computed, defineComponent, reactive } from 'vue'
import ColorSelect from '../com/ColorSelect.vue'

const szMap = { default: 20, large: 25, small: 15 }

export default defineComponent({
  name: 'ColorField',
  components: {
    ColorSelect
  },
  emits: ['submit'],
  props: {
    color: { type: String, default: '' },
    size: { type: String, default: 'default' }
  },
  setup(props, { emit }) {
    const formState = reactive({
      visible: false,
      color: '#000000'
    })
    const colDspSz = computed(() => szMap[props.size as 'default' | 'large' | 'small'])

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
      colDspSz,
      onSubmit
    }
  }
})
</script>
