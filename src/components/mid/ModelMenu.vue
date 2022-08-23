<template>
  <a-menu-item :key="mkey" @click.stop="(e: any) => e.preventDefault()">
    <template #icon>
      <keep-alive v-if="model.icon">
        <component :is="model.icon" />
      </keep-alive>
    </template>
    <span>{{ model.label || model.name }}</span>
  </a-menu-item>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import * as antdIcons from '@ant-design/icons-vue/lib/icons'

export default defineComponent({
  name: 'ModelMenu',
  components: antdIcons,
  props: {
    mkey: { type: String, required: true },
    model: { type: Object, required: true }
  }
})
</script>
