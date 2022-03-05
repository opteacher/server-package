<template>
  <a-menu :selectedKeys="selMdls" mode="inline" :style="{ height: '100%', borderRight: 0 }">
    <a-menu-item v-for="model of models" :key="model.key">
      <template #icon>
        <BorderlessTableOutlined />
      </template>
      <span>{{ model.desc || model.name }}</span>
    </a-menu-item>
  </a-menu>
</template>

<script>
import { defineComponent, onMounted, computed } from 'vue'
import { BorderlessTableOutlined } from '@ant-design/icons-vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'NaviSideBar',
  components: {
    BorderlessTableOutlined
  },
  setup() {
    const store = useStore()
    const models = computed(() => store.getters['models'])
    const selMdls = computed(() => store.getters['selMdls'])
    onMounted(() => store.dispatch('refresh'))
    return {
      models,
      selMdls
    }
  }
})
</script>
