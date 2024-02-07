<template>
  <opt-scl-pnl
    url="/stock-crawler/api/v1/stock/watch"
    @before-start="onBefStart"
    @after-end="onAftEnd"
  />
</template>

<script lang="ts" setup>
import { reqDelete, reqPost } from '@/utils'
import OptSclPnl from '@lib/components/OptSclPnl.vue'

const onBefStart = () =>
  reqPost('stock', undefined, {
    project: 'stock-crawler',
    type: 'job',
    action: 'crawl'
  })
const onAftEnd = () =>
  reqDelete('stock', 'crawl/stock_crawl', {
    project: 'stock-crawler',
    type: 'job'
  })
</script>
