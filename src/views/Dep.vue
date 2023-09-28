<template>
  <LytMain active="dependency">
    <EditableTable
      title="依赖"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :new-fun="() => new Dep()"
      sclHeight="h-full"
    />
  </LytMain>
</template>

<script lang="ts" setup name="Dependency">
import { depAPI as api } from '../apis'
import LytMain from '../layouts/LytMain.vue'
import Dep from '../types/dep'
import { columns, mapper } from './Dep'
</script>
