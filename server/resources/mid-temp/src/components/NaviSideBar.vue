<template>
  <a-menu
    :selectedKeys="[store.getters.model.key]"
    mode="inline"
    :style="{ height: '100%', borderRight: 0 }"
  >
    <a-menu-item
      v-for="model of store.getters.models"
      :key="model.key"
      @click="store.dispatch('refresh', model.key)"
    >
      <template #icon>
        <BorderlessTableOutlined />
      </template>
      <span>{{ model.desc || model.name }}</span>
    </a-menu-item>
  </a-menu>
</template>

<script>
import { defineComponent, onMounted } from 'vue'
import { BorderlessTableOutlined } from '@ant-design/icons-vue'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'NaviSideBar',
  components: {
    BorderlessTableOutlined
  },
  setup() {
    const store = useStore()
    onMounted(() => store.dispatch('refresh'))
    return {
      store
    }
  }
})
</script>
