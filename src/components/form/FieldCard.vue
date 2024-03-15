<template>
  <div
    v-if="index === 0"
    class="pb-2.5"
    :style="{
      width: `${cmpRect[2]}px`
    }"
    @dragover.stop="e => e.preventDefault()"
    @dragenter.stop="e => onDragEnter(e, `divider_top_${field.key}`)"
    @dragleave.stop="onDragLeave"
    @drop.stop="e => onDropDown(e)"
  >
    <div
      v-show="showDivider('top')"
      :id="`divider_top_${field.key}`"
      class="hidden h-0.5 bg-primary"
    />
  </div>
  <div
    :class="{ 'card-hover': mosMvOver && active !== field.key }"
    class="cursor-pointer rounded z-30"
    :style="{
      border: active === field.key ? '2px solid #1890ff' : '2px solid white'
    }"
    @click.stop="$emit('update:active', field)"
    :draggable="true"
    @mouseenter="mosMvOver = true"
    @mouseleave="mosMvOver = false"
    @dragstart.stop="onDragStart"
    @dragenter.stop="onDragEnter"
    @dragleave.stop="onDragLeave"
    @dragover.stop="e => e.preventDefault()"
    @drag.stop="onDragging"
    @drop.stop="e => onDropDown(e)"
  >
    <a-button
      v-if="active === field.key"
      danger
      type="primary"
      size="small"
      class="absolute top-0 -right-7"
      @click.stop="onFieldDel"
    >
      <template #icon>
        <CloseOutlined />
      </template>
    </a-button>
    <FormItem
      :id="field.key"
      class="p-2.5 m-0 relative"
      :form="form"
      :skey="field.refer"
      :mapper="{ ...mapper, disabled: true }"
    />
  </div>
  <div
    class="px-2.5 py-0"
    :style="{
      width: `${cmpRect[2]}px`
    }"
    @dragover.stop="e => e.preventDefault()"
    @dragenter.stop="e => onDragEnter(e, `divider_btm_${field.key}`)"
    @dragleave.stop="onDragLeave"
    @drop.stop="e => onDropDown(e)"
  >
    <div
      v-show="showDivider('btm')"
      :id="`divider_btm_${field.key}`"
      class="hidden h-0.5 bg-primary"
    />
  </div>
</template>

<script lang="ts">
import Field from '@lib/types/field'
import { computed, createVNode, defineComponent, onMounted, reactive, ref } from 'vue'
import { Modal } from 'ant-design-vue'
import { CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { waitFor } from '@/utils'
import { useStore } from 'vuex'
import { mdlAPI as api } from '../../apis'
import { createByFields } from '@lib/types/mapper'
import { bsTpDefault } from '@/types'

export default defineComponent({
  name: 'FieldCard',
  components: {
    CloseOutlined
  },
  props: {
    index: { type: Number, required: true },
    field: { type: Field, required: true },
    active: { type: String, required: true },
    onDropDown: { type: Function, required: true }
  },
  emits: ['delete', 'update:active', 'drag'],
  setup(props, { emit }) {
    const store = useStore()
    const cmpRect = reactive([0, 0, 0, 0] as [number, number, number, number])
    const rszObs = new ResizeObserver(onFieldResized)
    const mosMvOver = ref(false)
    const form = computed(() => ({
      [props.field.refer]: props.field.default || bsTpDefault(props.field.vtype)
    }))
    const mapper = computed(() => createByFields([props.field])[props.field.refer])

    onMounted(async () => {
      const el = await onFieldResized()
      if (el) {
        rszObs.observe(el)
      }
    })
    store.getters['model/emitter'].on('refresh', onFieldResized)

    async function onFieldResized() {
      const res = await waitFor(props.field.key)
      if (!res) {
        return
      }
      const el = res as HTMLElement
      cmpRect[0] = el.offsetLeft
      cmpRect[1] = el.offsetTop
      cmpRect[2] = el.clientWidth
      cmpRect[3] = el.clientHeight
      return el
    }
    function onFieldDel() {
      Modal.confirm({
        title: '确定删除该表单组件吗？',
        icon: createVNode(ExclamationCircleOutlined),
        content: '不可恢复！',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk: () => api.form.fields.remove(props.active)
      })
    }
    function onDragStart(e: DragEvent) {
      if (!e.dataTransfer) {
        return
      }
      e.dataTransfer.setData('text/plain', props.field.key)
      emit('drag', props.field)
    }
    function onDragEnter(e: DragEvent, key?: string) {
      store.commit('model/SET_DRAG_ON', key || props.field.key)
      mosMvOver.value = true
    }
    function onDragLeave() {
      mosMvOver.value = false
      // store.commit('model/SET_DRAG_ON', '')
    }
    function onDragging(e: DragEvent) {
      const dgOnKey = store.getters['model/dragOn']
      const el = document.getElementById(dgOnKey)
      if (!el) {
        return
      }
      const diff = e.offsetY - el.offsetTop
      if (diff >= el.clientHeight >> 2) {
        store.commit('model/SET_DIVIDER', `divider_btm_${dgOnKey}`)
      } else {
        store.commit('model/SET_DIVIDER', `divider_${getPreField()}`)
      }
    }
    function getPreField() {
      const dgOnKey = store.getters['model/dragOn']
      const keys = Object.keys(store.getters['model/fields'])
      if (keys.indexOf(dgOnKey) !== 0) {
        return `btm_${keys[keys.indexOf(dgOnKey) - 1]}`
      } else {
        return `top_${keys[0]}`
      }
    }
    function showDivider(pos: 'top' | 'btm') {
      return (
        store.getters['model/dragOn'] === `divider_${pos}_${props.field.key}` ||
        store.getters['model/divider'] === `divider_${pos}_${props.field.key}`
      )
    }
    return {
      store,
      cmpRect,
      mosMvOver,
      mapper,
      form,

      onFieldDel,
      onDragStart,
      onDragEnter,
      onDragLeave,
      onDragging,
      showDivider
    }
  }
})
</script>

<style>
.card-hover {
  border-radius: 3px;
  box-shadow:
    0 4px 8px 0 rgba(0, 0, 0, 0.2),
    0 6px 20px 0 rgba(0, 0, 0, 0.19);
  transition: all 200ms ease-out;
}
</style>
