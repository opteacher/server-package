<template>
<div class="container">
  <a-page-header
    style="border: 1px solid rgb(235, 237, 240)"
    :title="model.name"
    @back="() => router.go(-1)"
  >
    <a-descriptions size="small" :column="5">
      <a-descriptions-item
        v-for="prop in model.props"
        :key="prop.key"
        :label="prop.name"
      >
        {{ prop.type }}
      </a-descriptions-item>
    </a-descriptions>
  </a-page-header>
  <slot/>
</div>
</template>

<script lang="ts">
import { Model } from '@/common'
import { reqGet } from '@/utils'
import { defineComponent, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
export default defineComponent({
  name: 'DataTable',
  setup () {
    const route = useRoute()
    const router = useRouter()
    const model = reactive(new Model())

    onMounted(async () => {
      Model.copy((await reqGet('model', route.params.mid)).data, model)
    })

    return {
      router,
      model
    }
  }
})
</script>

