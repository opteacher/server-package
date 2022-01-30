<template>
<a-modal title="选择组" width="35vw"
  :visible="$store.getters['route/joinVsb']"
  @ok="$emit('submit', value)"
  @cancel="$store.commit('route/SET_JOIN_VSB', false)"
>
  <a-row type="flex">
    <a-col flex="auto">
      <a-select
        v-if="mode === 'select'"
        style="width: 98%"
        placeholder="选择节点组"
        :options="options"
      />
      <a-input
        v-else
        style="width: 98%"
        v-model:value="value"
        placeholder="输入节点组"
      />
    </a-col>
    <a-col flex="32px">
      <a-button @click="mode = mode === 'select' ? 'input' : 'select'">
        <template #icon>
          <SelectOutlined v-if="mode === 'select'" />
          <EditOutlined v-else />
        </template>
      </a-button>
    </a-col>
  </a-row>
</a-modal>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref } from 'vue'
import { EditOutlined, SelectOutlined } from '@ant-design/icons-vue'
import { useStore } from 'vuex'
import { EditNodeMapper } from '@/views/Flow'
import { OpnType } from '@/common'

export default defineComponent({
  name: 'JoinDialog',
  components: {
    EditOutlined,
    SelectOutlined
  },
  emits: ['submit'],
  setup () {
    const store = useStore()
    const mode = ref('select')
    const value = ref('')
    const options = reactive([] as {
      label: string, value: any
    }[])

    onMounted(async () => {
      await store.dispatch('route/rfshTemps')
      options.splice(0, options.length)
      options.push(...store.getters['route/tempGrps'])
    })
    return {
      mode,
      value,
      options
    }
  }
})
</script>
