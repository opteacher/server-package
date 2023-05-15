<script lang="ts">
import { Method, methods as Methods } from '@/types/service'
import { defineComponent, onMounted, reactive, watch } from 'vue'

export default defineComponent({
  name: 'ModelServiceSelect',
  emits: ['update:methods'],
  props: {
    methods: {
      type: Array,
      required: true
    }
  },
  setup(props, { emit }) {
    const methodState = reactive<Method[]>(props.methods as Method[])

    onMounted(refresh)
    watch(() => props.methods, refresh)

    function refresh() {
      methodState.splice(0, methodState.length, ...(props.methods as Method[]))
    }
    async function onSvcAddOrDel(checked: boolean, method: Method) {
      if (checked) {
        methodState.push(method)
      } else {
        methodState.splice(methodState.indexOf(method), 1)
      }
      emit('update:methods', methodState)
    }
    return {
      Methods,
      methodState,

      onSvcAddOrDel
    }
  }
})
</script>

<template>
  <a-checkable-tag
    v-for="method in Methods"
    :key="method"
    :checked="methodState.includes(method)"
    @change="(checked: boolean) => onSvcAddOrDel(checked, method)"
  >
    {{ method }}
  </a-checkable-tag>
</template>
