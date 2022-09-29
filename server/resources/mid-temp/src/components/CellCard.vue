<template>
  <a v-if="pcsCell.ctype === 'Link'" @click.stop="$router.push(fmtHref)">
    <HighLight
      v-if="search.text && search.column === pcsCell.refer"
      :text="fmtTxt"
      :search="search.text"
    />
    <template v-else>{{ fmtTxt }}</template>
  </a>
  <span
    v-else
    :style="{
      color: selected ? '#1890ff' : pcsCell.color
    }"
  >
    <HighLight
      v-if="search.text && search.column === pcsCell.refer"
      :text="fmtTxt"
      :search="search.text"
    />
    <template v-else>{{ fmtTxt }}</template>
  </span>
</template>

<script lang="ts">
import { endsWith, fmtStrByObj } from '@/utils'
import { computed, defineComponent } from 'vue'
import dayjs from 'dayjs'
import HighLight from './HighLight.vue'
import Cell from '@/types/cell'

export default defineComponent({
  name: 'CellCard',
  components: {
    HighLight
  },
  props: {
    cell: { type: Object, required: true },
    text: { type: String, required: true },
    selected: { type: Boolean, default: false },
    record: { type: Object, default: null },
    search: { type: Object, default: {} }
  },
  setup(props) {
    const pcsCell = computed<Cell>((): Cell => {
      const ret = props.cell
      if (ret.cdCell) {
        for (const [cond, cell] of Object.entries(ret.cdCell)) {
          const conds = cond.split('_')
          const prop = conds[0]
          const cmp = conds[1]
          const tgtVal = conds[2]
          const srcVal = props.record[prop]
          switch (cmp) {
            case '=':
              if (srcVal == tgtVal) {
                return cell as Cell
              }
              break
            case '!=':
              if (srcVal != tgtVal) {
                return cell as Cell
              }
              break
            case '>':
              if (srcVal > tgtVal) {
                return cell as Cell
              }
              break
            case '>=':
              if (srcVal >= tgtVal) {
                return cell as Cell
              }
              break
            case '<':
              if (srcVal < tgtVal) {
                return cell as Cell
              }
              break
            case '<=':
              if (srcVal <= tgtVal) {
                return cell as Cell
              }
              break
          }
        }
      }
      return ret as Cell
    })
    const fmtTxt = computed(() => {
      let ret = props.text
      switch (pcsCell.value.ctype) {
        case 'Number':
          if (pcsCell.value.format.fix > 0) {
            ret = Number.parseFloat(ret).toFixed(pcsCell.value.format.fix)
          }
          break
        case 'DateTime':
          if (pcsCell.value.format.pattern) {
            ret = dayjs(props.text).format(pcsCell.value.format.pattern)
          }
      }
      return [
        pcsCell.value.prefix && !props.text.startsWith(pcsCell.value.prefix)
          ? pcsCell.value.prefix
          : '',
        ret,
        pcsCell.value.suffix && !endsWith(props.text, pcsCell.value.suffix)
          ? pcsCell.value.suffix
          : ''
      ].join('')
    })
    const fmtHref = computed(() =>
      fmtStrByObj(/\s?@.+?(?=\s)/g, props.record, pcsCell.value.format.href)
    )
    return {
      pcsCell,
      fmtTxt,
      fmtHref,
      endsWith
    }
  }
})
</script>
