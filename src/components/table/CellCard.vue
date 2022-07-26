<template>
  <span
    :style="{
      color: selected ? '#1890ff' : cell.color
    }"
  >
    {{ cell.prefix && !text.startsWith(cell.prefix) ? cell.prefix : '' }}{{ fmtTxt
    }}{{ cell.suffix && !endsWith(text, cell.suffix) ? cell.suffix : '' }}
  </span>
</template>

<script lang="ts">
import { endsWith } from '@/utils'
import { computed, defineComponent } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'CellCard',
  props: {
    cell: { type: Object, required: true },
    text: { type: String, required: true },
    selected: { type: Boolean, default: false }
  },
  setup(props) {
    const fmtTxt = computed(() => {
      let ret = props.text
      switch (props.cell.ctype) {
        case 'Number':
          if (props.cell.format.fix > 0) {
            ret = Number.parseFloat(ret).toFixed(props.cell.format.fix)
          }
          break
        case 'DateTime':
          if (props.cell.format.pattern) {
            ret = dayjs(props.text).format(props.cell.format.pattern)
          }
      }
      return ret
    })
    return {
      fmtTxt,
      endsWith
    }
  }
})
</script>
