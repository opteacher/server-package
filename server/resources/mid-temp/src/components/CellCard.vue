<template>
  <span
    :style="{
      color: selected ? '#1890ff' : cell.color
    }"
  >
    {{ cell.prefix && !text.startsWith(cell.prefix) ? cell.prefix : '' }}{{ text
    }}{{ cell.suffix && !endsWith(text, cell.suffix) ? cell.suffix : '' }}
  </span>
</template>

<script lang="ts">
import { endsWith } from '@/utils'
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'CellCard',
  props: {
    cell: { type: Object, required: true },
    text: { type: String, required: true },
    selected: { type: Boolean, default: false }
  },
  setup() {
    return {
      endsWith
    }
  }
})
</script>
