<template>
  <div class="h-full p-5">
    <OptSclPnl topic="server-package" @before-start="onAftStart" @after-end="onAftEnd" />
  </div>
</template>

<script lang="ts" setup>
import { reqDelete, reqGet, reqPost } from '@/utils'
import OptSclPnl from '@lib/components/OptSclPnl.vue'

const onAftStart = () => reqGet('temp', 'test', { project: 'server-package', type: 'api' })
const onAftEnd = () =>
  reqDelete('stock', 'update/stock_crawl', {
    project: 'stock-crawler',
    type: 'job'
  })
</script>
