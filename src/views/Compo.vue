<template>
  <LytMain active="component">
    <EditableTable
      title="组件"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :new-fun="() => newOne(Compo)"
      sclHeight="h-full"
    >
      <template #name="{ record: compo }">
        {{ compo.name }}&nbsp;/&nbsp;{{ cmpNickDict[compo.name as CompoType] }}
      </template>
      <template #expandedRowRender="{ record: compo }">
        <EditableTable
          title="额外配置"
          size="small"
          :api="{ all: () => compo.props }"
          :columns="fldColumns"
          :mapper="fldMapper"
          :new-fun="() => newOne(Field)"
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
import { cmpNickDict, CompoType } from '@lib/types'
import { newOne } from '@/utils'
</script>
