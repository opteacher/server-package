<template>
<a-collapse v-model:activeKey="group" style="width: 15vw" accordion>
  <a-collapse-panel v-for="grp in groups" :key="grp.value" :header="grp.label">
    <a-list size="small" :data-source="grp.children">
      <template #renderItem="{ item: temp }">
        <a-list-item class="p-0">
          {{ temp.label }}
          <template #actions>
            <a><PlusOutlined /></a>
          </template>
        </a-list-item>
      </template>
    </a-list>
  </a-collapse-panel>
</a-collapse>
</template>

<script lang="ts">
import { EditNodeMapper } from '@/views/Flow'
import { defineComponent, onMounted, reactive, ref } from 'vue'
import { useStore } from 'vuex'
import { OpnType } from '@/common'
import { PlusOutlined } from '@ant-design/icons-vue'

export default defineComponent({
  name: 'LibraryCard',
  components: {
    PlusOutlined
  },
  setup () {
    const store = useStore()
    const group = ref('')
    const groups = reactive([] as OpnType[])

    onMounted(async () => {
      await store.dispatch('route/rfshTemps')
      groups.splice(0, groups.length)
      groups.push(...store.getters['route/tempGrps'])
    })
    return {
      group,
      groups
    }
  }
})
</script>
