<template>
  <OptSclPnl
    url="/stock-crawler/api/v1/stock/watch"
    @before-start="onAftStart"
    @after-end="onAftEnd"
  />
</template>

<script lang="ts" setup>
import { reqDelete, reqPost } from '@/utils'
import OptSclPnl from '@lib/components/OptSclPnl.vue'

const onAftStart = () =>
  reqPost('stock', undefined, {
    project: 'stock-crawler',
    type: 'job',
    action: 'crawl'
  })
const onAftEnd = () =>
  reqDelete('stock', 'update/stock_crawl', {
    project: 'stock-crawler',
    type: 'job'
  })
</script>
