<template>
  <LytMain active="database">
    <EditableTable
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :new-fun="() => newOne(Database)"
      title="数据库"
    />
  </LytMain>
</template>

<script lang="ts" setup name="Database">
import { newOne } from '@/utils'

import { dbAPI as api } from '../apis'
import LytMain from '../layouts/LytMain.vue'
import Database from '../types/database'
import { columns, mapper } from './Database'
</script>
