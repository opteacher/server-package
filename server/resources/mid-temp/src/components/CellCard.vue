<template>
  <a v-if="cell.ctype === 'Link'" :href="fmtHref">{{ fmtTxt }}</a>
  <span
    v-else
    :style="{
      color: selected ? '#1890ff' : cell.color
    }"
  >
    {{ fmtTxt }}
  </span>
</template>

<script lang="ts">
import { endsWith, fmtStrByObj } from '@/utils'
import { computed, defineComponent } from 'vue'
import dayjs from 'dayjs'

export default defineComponent({
  name: 'CellCard',
  props: {
    cell: { type: Object, required: true },
    text: { type: String, required: true },
    selected: { type: Boolean, default: false },
    record: { type: Object, default: null }
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
      return [
        props.cell.prefix && !props.text.startsWith(props.cell.prefix) ? props.cell.prefix : '',
        ret,
        props.cell.suffix && !endsWith(props.text, props.cell.suffix) ? props.cell.suffix : ''
      ].join('')
    })
    const fmtHref = computed(() =>
      fmtStrByObj(/\s@.+?(?=\s)/g, props.record, props.cell.format.href)
    )
    return {
      fmtTxt,
      fmtHref,
      endsWith
    }
  }
})
</script>
