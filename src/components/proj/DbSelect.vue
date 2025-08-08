<template>
  <div class="flex space-x-2">
    <slot name="select" />
    <a-dropdown :disabled="!form.name">
      <template #overlay>
        <a-menu
          @click="async ({ key }: any) => emit('update:form', await onDbGenByName(form.name, key))"
        >
          <a-menu-item v-for="[key, val] in Object.entries(dbDict)" :key="key">
            {{ val.label }}
          </a-menu-item>
        </a-menu>
      </template>
      <a-button>
        <template #icon><DownOutlined /></template>
        以项目名创建
      </a-button>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { dbAPI } from '@/apis'
import { updateDbOpns } from '@/views/Home'
import { dbDict } from '@/types/database'
import { DownOutlined } from '@ant-design/icons-vue'

defineProps({
  form: { type: Object, required: true }
})
const emit = defineEmits(['update:form'])

async function onDbGenByName(name: string, type: 'mysql' | 'mongo') {
  const db = await dbAPI.addByName(name, type)
  await updateDbOpns()
  return db.key
}
</script>
