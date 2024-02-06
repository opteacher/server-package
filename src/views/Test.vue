<template>
  <opt-scl-pnl url="http://127.0.0.1:7132/stock-crawler/api/v1/stock/watch" />
</template>

<script lang="ts" setup>
import OptSclPnl from '@lib/components/OptSclPnl.vue'

// import { reqAll } from '@/utils'
// import { onMounted } from 'vue'

// onMounted(refresh)

// async function refresh() {
//   console.log(await reqAll('stock', { project: 'stock-crawler' }))
// }
</script>
