<template>
  <LytMain active="component">
    <EditableTable
      title="组件"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Compo.copy"
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
        />
      </template>
    </EditableTable>
  </LytMain>
</template>

<script lang="ts" setup name="Component">
import LytMain from '../layouts/LytMain.vue'
import { columns, mapper, fldColumns, fldMapper } from './Compo'
import Compo from '@lib/types/compo'
import Field from '@lib/types/field'
import { cmpAPI as api } from '../apis'
</script>
