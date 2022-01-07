<template>
<div class="flow-container">
  <a-page-header
    class="demo-page-header"
    style="border: 1px solid rgb(235, 237, 240)"
    :title="route.method"
    :sub-title="route.path"
    @back="() => router.go(-1)"
  >
    <!-- <a-descriptions size="small" :column="3">
      <a-descriptions-item label="占用端口">
        {{ editProj.current.port }}
      </a-descriptions-item>
      <a-descriptions-item label="API前缀">
        {{ editProj.current.path }}
      </a-descriptions-item>
      <a-descriptions-item label="数据库">
        {{ editProj.current.database.join('/') }}
      </a-descriptions-item>
      <a-descriptions-item label="状态">
        <template v-if="editProj.current.status === 'starting'">
          <a-spin size="small"/>&nbsp;启动中……
        </template>
        <a-badge v-else
          :status="editProj.current.thread ? 'processing' : 'default'"
          :text="editProj.current.thread ? '运行中' : '已停止'"
        />
      </a-descriptions-item>
    </a-descriptions> -->
  </a-page-header>
  <slot/>
</div>
</template>

<script lang="ts">
import { Route } from '@/common'
import { defineComponent } from 'vue'
export default defineComponent({
  name: 'FlowDesign',
  props: {
    route: { type: Route, required: true },
  }
})
</script>

<style lang="less">
.flow-container {
  padding: 50px 100px;
}
</style>
