<template>
  <a-card
    hoverable
    :headStyle="{ backgroundColor: '#9d16ff', color: 'white' }"
    @click="() => emitter.emit('update:visible', { show: true, object: typo })"
  >
    <template #title>
      {{ typo.name }}
      <span class="float-right">{{ typo.label }}</span>
    </template>
    <div>
      <b>@</b>
      constructor({{
        (typo.params || [])
          .concat(typo.props.filter(prop => prop.index).map(prop => prop.name))
          .join(', ')
      }})
    </div>
    <a-divider v-if="typo.props" class="my-3" />
    <ul class="pl-0 mb-0 list-none">
      <li v-for="prop of typo.props" :key="prop.key" class="px-1 pb-0.5">
        <b>-</b>
        {{ prop.name }}:&nbsp;{{ prop.ptype }}&nbsp;({{ prop.dftVal }})
        <span class="float-right">{{ prop.label }}</span>
      </li>
    </ul>
    <a-divider v-if="typo.funcs" class="my-3" />
    <ul class="pl-0 mb-0 list-none">
      <li
        v-for="func of typo.funcs"
        :key="func.key"
        class="px-1 pb-0.5 hover:bg-gray-200"
        @click.stop="() => router.push(`/project/${pid}/typo/${typo.key}/func/${func.key}`)"
      >
        <b>+</b>
        {{ (func.isAsync ? 'async ' : '') + func.name }}&nbsp;(
        <span v-for="arg of func.args" :key="arg.key">{{ arg.name }}:&nbsp;{{ arg.ptype }}</span>
        )
        <span class="float-right">{{ func.label }}</span>
      </li>
    </ul>
  </a-card>
</template>

<script setup lang="ts">
import Typo from '@/types/typo'
import { TinyEmitter } from 'tiny-emitter'
import { useRoute, useRouter } from 'vue-router'

defineProps({
  typo: { type: Typo, required: true },
  emitter: { type: TinyEmitter, required: true }
})
const route = useRoute()
const pid = route.params.pid
const router = useRouter()
</script>
