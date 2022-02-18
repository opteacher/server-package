<template>
  <LytForm>
    <a-layout style="position: fixed; top: 104px; bottom: 30px">
      <a-layout-sider width="30vw" :style="{ padding: '20px' }">
        <a-list :grid="{ gutter: 16, column: 2 }" :data-source="compos">
          <template #renderItem="{ item: compo }">
            <a-list-item>
              <a-card :title="compo.name">Card content</a-card>
            </a-list-item>
          </template>
        </a-list>
      </a-layout-sider>
      <a-layout-content>Content</a-layout-content>
    </a-layout>
  </LytForm>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue'
import LytForm from '../layouts/LytForm.vue'

export default defineComponent({
  name: 'Form',
  components: {
    LytForm
  },
  setup() {
    const compos = reactive([
      { name: 'abcd' },
      { name: 'abcd' },
      { name: 'abcd' },
      { name: 'abcd' }
    ])
    return {
      compos
    }
  }
})
</script>
