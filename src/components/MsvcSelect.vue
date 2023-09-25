<script lang="ts" setup name="ModelServiceSelect">
import { Method, methods as Methods } from '@/types/service'
import { defineEmits, defineProps, onMounted, ref, watch } from 'vue'

const emit = defineEmits(['update:methods'])
const props = defineProps({
  methods: {
    type: Array,
    required: true
  }
})
const mstate = ref<Method[]>(props.methods as Method[])

onMounted(refresh)
watch(() => [...props.methods], refresh)

function refresh() {
  mstate.value = props.methods as Method[]
}
async function onSvcAddOrDel(checked: boolean, method: Method) {
  if (checked) {
    mstate.value.push(method)
  } else {
    mstate.value.splice(mstate.value.indexOf(method), 1)
  }
  emit('update:methods', mstate)
}
</script>

<template>
  <a-checkable-tag
    v-for="method in Methods"
    :key="method"
    :checked="mstate.includes(method)"
    @change="(checked: boolean) => onSvcAddOrDel(checked, method)"
  >
    {{ method }}
  </a-checkable-tag>
</template>
