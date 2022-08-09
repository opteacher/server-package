<template>
  <div class="b-1 br-4">
    <v-ace-editor
      v-model:value="editing"
      lang="javascript"
      theme="chrome"
      style="height: 300px"
      :options="{ tabSize: 2, readOnly: disabled }"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue'
import { VAceEditor } from 'vue3-ace-editor'
import 'ace-builds/src-min-noconflict/theme-chrome'
import 'ace-builds/src-min-noconflict/mode-javascript'
import 'ace-builds/src-min-noconflict/mode-json'
import 'ace-builds/src-min-noconflict/ext-language_tools'

export default defineComponent({
  name: 'VueAceEditor',
  components: {
    VAceEditor
  },
  emits: ['update:value'],
  props: {
    value: { type: String, required: true },
    disabled: { type: Boolean, default: false }
  },
  setup(props, { emit }) {
    const editing = ref(props.value)

    watch(
      () => editing.value,
      () => emit('update:value', editing.value)
    )
    watch(
      () => props.value,
      () => {
        editing.value = props.value
      }
    )

    return {
      editing
    }
  }
})
</script>
