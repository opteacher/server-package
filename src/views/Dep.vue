<template>
  <LytMain active="dependency">
    <EditableTable
      title="依赖"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :new-fun="() => newOne(Dep)"
      sclHeight="h-full"
    >
      <template #exports="{ record }">
        <ul class="list-none pl-0 mb-0">
          <li v-for="exp in record.exports" :key="exp">{{ exp }}</li>
        </ul>
      </template>
    </EditableTable>
  </LytMain>
</template>

<script lang="ts" setup name="Dependency">
import { newOne } from '@/utils'

import { depAPI as api } from '../apis'
import LytMain from '../layouts/LytMain.vue'
import Dep from '../types/dep'
import { columns, mapper } from './Dep'
</script>
