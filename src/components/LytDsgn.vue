<script lang="ts">
import { FrtLyt } from '@/types/frontend'
import { defineComponent, reactive } from 'vue'

export default defineComponent({
  name: 'LytDsgn',
  props: {
    layout: { type: Array, required: true }
  },
  emits: ['update:layout'],
  setup(props, { emit }) {
    const lytState = reactive<Set<FrtLyt>>(new Set(props.layout as FrtLyt[]))

    function onFragClick(frag: FrtLyt) {
      if (lytState.has(frag)) {
        lytState.delete(frag)
      } else {
        lytState.add(frag)
      }
      console.log(lytState)
      emit('update:layout', Array.from(lytState))
    }
    return {
      lytState,
      onFragClick
    }
  }
})
</script>

<template>
  <a-layout>
    <a-layout-header
      class="h-8 leading-8 cursor-pointer border-1 border-solid border-white hover:border-primary"
      :class="{
        'bg-primary': lytState.has('header'),
        'text-white': lytState.has('header'),
        'bg-ant-gray': !lytState.has('header')
      }"
      @click="() => onFragClick('header')"
    >
      Header
    </a-layout-header>
    <a-layout class="h-16">
      <a-layout-sider
        class="text-center cursor-pointer leading-16 border-1 border-solid border-white hover:border-primary"
        :class="{
          'bg-primary': lytState.has('lSider'),
          'text-white': lytState.has('lSider'),
          'bg-ant-gray': !lytState.has('lSider')
        }"
        @click="() => onFragClick('lSider')"
      >
        Sider
      </a-layout-sider>
      <a-layout-content
        class="text-center cursor-pointer leading-16 border-1 border-solid border-white hover:border-primary"
        :class="{
          'bg-primary': lytState.has('content'),
          'text-white': lytState.has('content'),
          'bg-ant-gray': !lytState.has('content')
        }"
        @click="() => onFragClick('content')"
      >
        Content
      </a-layout-content>
      <a-layout-sider
        class="text-center cursor-pointer leading-16 border-1 border-solid border-white hover:border-primary"
        :class="{
          'bg-primary': lytState.has('rSider'),
          'text-white': lytState.has('rSider'),
          'bg-ant-gray': !lytState.has('rSider')
        }"
        @click="() => onFragClick('rSider')"
      >
        Sider
      </a-layout-sider>
    </a-layout>
    <a-layout-footer
      class="h-8 leading-8 py-0 cursor-pointer border-1 border-solid border-white hover:border-primary"
      :class="{
        'bg-primary': lytState.has('footer'),
        'text-white': lytState.has('footer'),
        'bg-ant-gray': !lytState.has('footer')
      }"
      @click="() => onFragClick('footer')"
    >
      Footer
    </a-layout-footer>
  </a-layout>
</template>
