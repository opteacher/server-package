<template>
  <div
    v-if="index === 0"
    :style="{
      'padding-bottom': '12px',
      width: `${cmpRect[2]}px`
    }"
    @dragover.stop="e => e.preventDefault()"
    @dragenter.stop="e => onDragEnter(e, `divider_top_${field.key}`)"
    @dragleave.stop="onDragLeave"
    @drop.stop="e => onDropDown(e)"
  >
    <div
      v-show="
        store.getters['model/dragOn'] === `divider_top_${field.key}` ||
        store.getters['model/divider'] === `divider_top_${field.key}`
      "
      :id="`divider_top_${field.key}`"
      :style="{ display: 'none', height: '2px', 'background-color': '#1890ff' }"
    />
  </div>
  <FormItem :id="field.key" class="p-10 m-0" :field="field" :form="{}" style="position: relative" />
  <div
    :style="{
      padding: '12px 0',
      width: `${cmpRect[2]}px`
    }"
    @dragover.stop="e => e.preventDefault()"
    @dragenter.stop="e => onDragEnter(e, `divider_btm_${field.key}`)"
    @dragleave.stop="onDragLeave"
    @drop.stop="e => onDropDown(e)"
  >
    <div
      v-show="
        store.getters['model/dragOn'] === `divider_btm_${field.key}` ||
        store.getters['model/divider'] === `divider_btm_${field.key}`
      "
      :id="`divider_btm_${field.key}`"
      :style="{ display: 'none', height: '2px', 'background-color': '#1890ff' }"
    />
  </div>

  <div
    :class="{ 'card-hover': mosMvOver && active !== field.key }"
    :style="{
      cursor: 'pointer',
      position: 'absolute',
      left: `${cmpRect[0]}px`,
      top: `${cmpRect[1]}px`,
      width: `${cmpRect[2]}px`,
      height: `${cmpRect[3]}px`,
      border: active === field.key ? '2px solid #1890ff' : '',
      'border-radius': '4px'
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
      :style="{ position: 'absolute', top: 0, right: '-30px' }"
      @click.stop="onFieldDel"
    >
      <template #icon>
        <CloseOutlined />
      </template>
    </a-button>
  </div>
</template>

<script lang="ts">
import Field, { mgnBtm } from '@/types/field'
import { createVNode, defineComponent, onMounted, reactive, ref } from 'vue'
import { Modal } from 'ant-design-vue'
import { CloseOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { waitFor } from '@/utils'
import { useStore } from 'vuex'
import { mdlAPI as api } from '../../apis'
import FormItem from './FormItem.vue'

export default defineComponent({
  name: 'FieldCard',
  components: {
    CloseOutlined,

    FormItem
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
    return {
      store,
      mgnBtm,
      cmpRect,
      mosMvOver,

      onFieldDel,
      onDragStart,
      onDragEnter,
      onDragLeave,
      onDragging
    }
  }
})
</script>

<style lang="less">
.card-hover {
  border-radius: 3px;
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
  transition: all 200ms ease-out;
}
</style>
