<template>
  <LytMain active="dependency">
    <EditableTable
      title="依赖"
      size="small"
      :api="api"
      :columns="columns"
      :mapper="mapper"
      :copy="Dep.copy"
      :emitter="emitter"
      sclHeight="h-full"
    />
  </LytMain>
</template>

<script lang="ts" setup name="Dependency">
import { TinyEmitter as Emitter } from 'tiny-emitter'

import { depAPI as api } from '../apis'
import LytMain from '../layouts/LytMain.vue'
import Dep from '../types/dep'
import { columns, mapper } from './Dep'

const emitter = new Emitter()
</script>
