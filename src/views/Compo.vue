<template>
  <LytMain active="component">
    <EditableTable
      title="组件"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Compo.copy"
      :emitter="emitter"
      sclHeight="h-full"
    >
      <template #expandedRowRender="{ record: compo }">
        <EditableTable
          title="额外配置"
          size="small"
          :api="{ all: () => compo.props }"
          :columns="fldColumns"
          :mapper="fldMapper"
          :copy="Field.copy"
          :emitter="fldEmitter"
        />
      </template>
    </EditableTable>
  </LytMain>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
import LytMain from '../layouts/LytMain.vue'
import { columns, mapper, fldColumns, fldMapper } from './Compo'
import Compo from '@lib/types/compo'
import Field from '@lib/types/field'
import { cmpAPI as api } from '../apis'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export default defineComponent({
  name: 'Component',
  components: {
    LytMain
  },
  setup() {
    const emitter = new Emitter()
    const fldEmitter = new Emitter()
    return {
      Compo,
      Field,

      api,
      columns,
      mapper,
      emitter,
      fldColumns,
      fldMapper,
      fldEmitter
    }
  }
})
</script>
