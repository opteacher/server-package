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
    @drop="onDropDown"
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
  <a-form-item :id="field.key" class="p-10 m-0" style="position: relative">
    <template #label>
      {{ field.label }}&nbsp;
      <a-tooltip v-if="field.desc">
        <template #title>{{ field.desc }}</template>
        <InfoCircleOutlined style="color: #1890ff" />
      </a-tooltip>
    </template>
    <a-input v-if="field.type === 'Input'" />
    <a-select v-else-if="field.type === 'Select'" class="w-100" />
    <a-input-number v-else-if="field.type === 'Number'" class="w-100" />
    <a-checkbox v-else-if="field.type === 'Checkbox'" />
  </a-form-item>
  <div
    :style="{
      padding: '12px 0',
      width: `${cmpRect[2]}px`
    }"
    @dragover.stop="e => e.preventDefault()"
    @dragenter.stop="e => onDragEnter(e, `divider_btm_${field.key}`)"
    @dragleave.stop="onDragLeave"
    @drop="onDropDown"
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
    @click.stop="$emit('update:active', field.key)"
    :draggable="true"
    @mouseenter="mosMvOver = true"
    @mouseleave="mosMvOver = false"
    @dragstart.stop="onDragStart"
    @dragenter.stop="onDragEnter"
    @dragleave.stop="onDragLeave"
    @dragover.stop="e => e.preventDefault()"
    @drag.stop="onDragging"
    @drop.stop="onDropDown"
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
import { CloseOutlined, ExclamationCircleOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import { waitFor } from '@/utils'
import { useStore } from 'vuex'

export default defineComponent({
  name: 'FieldCard',
  components: {
    InfoCircleOutlined,
    CloseOutlined
  },
  props: {
    index: { type: Number, required: true },
    field: { type: Field, required: true },
    active: { type: String, required: true }
  },
  emits: ['delete', 'update:active', 'drag'],
  setup(props, { emit }) {
    const store = useStore()
    const cmpRect = reactive([0, 0, 0, 0] as [number, number, number, number])
    const rszObs = new ResizeObserver(onFieldResized)
    const mosMvOver = ref(false)

    onMounted(async () => {
      rszObs.observe(await onFieldResized())
    })
    store.getters['model/emitter'].on('refresh', onFieldResized)

    async function onFieldResized() {
      const el = (await waitFor(props.field.key)) as HTMLElement
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
        onOk: async () => {
          await store.dispatch('model/delField', props.active)
        }
      })
    }
    function onDragStart(e: DragEvent) {
      e.dataTransfer?.setData('text/plain', props.field.key)
      emit('drag', props.field.key)
    }
    function onDragEnter(e: DragEvent, key?: string) {
      store.commit('model/SET_DRAG_ON', key || props.field.key)
      mosMvOver.value = true
    }
    function onDragLeave() {
      mosMvOver.value = false
      // store.commit('model/SET_DRAG_ON', '')
    }
    function onDropDown(e: DragEvent) {
      e.preventDefault()
      const instPos = (
        store.getters['model/dragOn'].startsWith('divider')
          ? store.getters['model/dragOn']
          : store.getters['model/divider']
      ).split('_')
      if (instPos.length !== 3) {
        return
      }
      const dragField = e.dataTransfer?.getData('text/plain')
      const insertPos = { field: instPos[2], pos: instPos[1] === 'top' ? 'before' : 'after' }
      if (dragField?.startsWith('compo_')) {
        store.dispatch('model/newField', {
          compoType: dragField.substring('compo_'.length),
          insertPos
        })
      } else {
        store.dispatch('model/insertField', { dragField, insertPos })
      }
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
      onDragging,
      onDropDown
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
