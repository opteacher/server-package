<template>
  <LytMain active="database">
    <EditableTable
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :new-fun="() => new Database()"
      title="数据库"
    />
  </LytMain>
</template>

<script lang="ts" setup name="Database">
import { defineComponent, ref } from 'vue'
import LytMain from '../layouts/LytMain.vue'
import Database from '../types/database'
import { columns, mapper } from './Database'
import { dbAPI as api } from '../apis'
</script>
