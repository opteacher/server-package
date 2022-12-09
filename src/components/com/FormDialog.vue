<template>
  <a-modal
    v-model:visible="visible"
    :title="title"
    :width="width"
    :confirmLoading="!editable || okLoading"
    :footer="viewOnly ? null : undefined"
    @cancel="onCclClick"
  >
    <template #footer>
      <template v-if="$slots['footer']">
        <slot name="footer" v-bind="formState" />
      </template>
      <template v-else>
        <a-button type="default" @click="onCclClick">取消</a-button>
        <a-button type="primary" @click="onOkClick">确定</a-button>
      </template>
    </template>
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ span: column[0] }"
      :wrapper-col="{ span: column[1] }"
    >
      <template v-for="(value, key) in formMapper" :key="key">
        <template v-if="value.type === 'Group' && validConds(formState, value.display)">
          <div v-if="value.fold" class="b-1 pt-30 plr-10 mtb-30 pos-rel br-4">
            <a-button
              type="link"
              size="small"
              class="pos-abs white-bkgd"
              :style="{ left: '5px', top: '-11px' }"
              @click="value.fold = !value.fold"
              :disabled="validConds(formState, value.disabled)"
            >
              {{ value.label }}
            </a-button>
            <a-button
              type="link"
              size="small"
              class="pos-abs white-bkgd"
              :style="{ right: '-12px', top: '-12px' }"
              @click="value.fold = !value.fold"
              :disabled="validConds(formState, value.disabled)"
            >
              <template #icon><minus-outlined /></template>
            </a-button>
            <FormItem
              v-for="(v, k) in value.items"
              :key="k"
              :form="formState"
              :skey="k.toString()"
              :value="(v as Object)"
              :editable="editable"
              :viewOnly="viewOnly"
            >
              <template #FormDialog>
                <FormDialog
                  v-model:show="v.show"
                  :mapper="v.mapper"
                  :copy="v.copy"
                  :emitter="v.emitter"
                  :object="v.editing"
                  @submit="(form: any) => v.onSaved(form, formState[k])"
                />
              </template>
              <template v-if="$slots[k]" #[k]="{ formState }">
                <slot :name="k" v-bind="{ formState }" />
              </template>
            </FormItem>
          </div>
          <div v-else class="bt-1 mtb-30 pos-rel">
            <a-button
              type="link"
              size="small"
              class="pos-abs white-bkgd"
              :style="{ left: '5px', top: '-11px' }"
              @click="value.fold = !value.fold"
            >
              {{ value.label }}
            </a-button>
            <a-button
              type="link"
              size="small"
              class="pos-abs white-bkgd"
              :style="{ right: '-12px', top: '-12px' }"
              @click="value.fold = !value.fold"
            >
              <template #icon><plus-outlined /></template>
            </a-button>
          </div>
        </template>
        <FormItem
          v-else
          :form="formState"
          :skey="(key as string)"
          :value="value"
          :editable="editable"
          :viewOnly="viewOnly"
        >
          <template #FormDialog>
            <FormDialog
              v-model:show="value.show"
              :mapper="value.mapper"
              :copy="value.copy"
              :emitter="value.emitter"
              :object="value.editing"
              @submit="(form: any) => value.onSaved(form, formState[key])"
            />
          </template>
          <template v-if="$slots[key]" #[key]="{ formState }">
            <slot :name="key" v-bind="{ formState }" />
          </template>
        </FormItem>
      </template>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import { defineComponent, onMounted, reactive, ref, watch } from 'vue'
import FormItem from './FormItem.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { PlusOutlined, MinusOutlined } from '@ant-design/icons-vue'
import { validConds } from '@/utils'

export default defineComponent({
  name: 'FormDialog',
  components: {
    FormItem,

    PlusOutlined,
    MinusOutlined
  },
  props: {
    show: { type: Boolean, default: false },
    copy: { type: Function, required: true },
    width: { type: String, default: '50vw' },
    column: { type: Array, default: () => [4, 20] }, // [0]标题宽度 [1]表单项宽度
    title: { type: String, default: 'Form Dialog' },
    object: { type: Object, default: null },
    mapper: { type: Mapper, required: true },
    emitter: { type: Emitter, default: null }
  },
  emits: ['initialize', 'update:show', 'submit'],
  setup(props, { emit }) {
    const visible = ref(props.show)
    const formRef = ref()
    const formState = reactive(props.copy(props.object || {}))
    const formRules = Object.fromEntries(
      Object.entries(props.mapper).map(entry => {
        return [entry[0], entry[1].rules]
      })
    )
    const formMapper = reactive(props.mapper)
    const editable = ref(true)
    const viewOnly = ref(false)
    const okLoading = ref(false)

    if (props.emitter) {
      props.emitter.on('editable', (edtb: boolean) => {
        editable.value = edtb
      })
      props.emitter.on(
        'update:show',
        (args: { show: boolean; cpyRcd?: (tgt: any) => void; viewOnly?: boolean }) => {
          if (!args.show) {
            visible.value = false
            return
          }
          viewOnly.value = typeof args.viewOnly != 'undefined' ? args.viewOnly : false
          if (args.cpyRcd) {
            args.cpyRcd(formState)
          }
          visible.value = args.show
        }
      )
      props.emitter.on('update:data', (data?: any) => {
        if (data) {
          props.copy(data, formState, true)
        } else if (formState.reset) {
          formState.reset()
        } else {
          props.copy({}, formState, true)
        }
      })
      props.emitter.on('update:mapper', (mapper: any) => {
        Mapper.copy(mapper, formMapper)
      })
      props.emitter.on('viewOnly', (vwOnly: boolean) => {
        viewOnly.value = vwOnly
      })
    }
    onMounted(() => {
      emit('initialize')
    })
    watch(
      () => props.show,
      (show: boolean) => {
        visible.value = props.show
        if (show && props.object) {
          props.copy(props.object, formState)
        }
      }
    )

    async function onOkClick() {
      try {
        okLoading.value = true
        await formRef.value.validate()
        emit('submit', formState, () => {
          okLoading.value = false
          formRef.value.resetFields()
          formState.reset && formState.reset()
          visible.value = false
          emit('update:show', false)
        })
      } catch (e) {
        console.log(e)
      }
    }
    function onCclClick() {
      formRef.value.resetFields()
      formState.reset && formState.reset()
      visible.value = false
      emit('update:show', false)
    }
    return {
      Column,

      visible,
      formRef,
      formState,
      formRules,
      formMapper,
      editable,
      viewOnly,
      okLoading,

      onOkClick,
      onCclClick,
      validConds
    }
  }
})
</script>
