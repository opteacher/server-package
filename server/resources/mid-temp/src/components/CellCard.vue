<template>
  <span
    :style="{
      color: selected ? '#1890ff' : cell.color
    }"
  >
    {{ cell.prefix && !strTxt.startsWith(cell.prefix) ? cell.prefix : '' }}{{ strTxt
    }}{{ cell.suffix && !endsWith(strTxt, cell.suffix) ? cell.suffix : '' }}
  </span>
</template>

<script lang="ts">
import { endsWith } from '@/utils'
import { computed, defineComponent } from 'vue'

export default defineComponent({
  name: 'CellCard',
  props: {
    cell: { type: Object, required: true },
    text: { type: Object, required: true },
    selected: { type: Boolean, default: false }
  },
  setup(props) {
    const strTxt = computed(() => (props.text ? props.text.toString() : ''))
    return {
      strTxt,
      endsWith
    }
  }
})
</script>
