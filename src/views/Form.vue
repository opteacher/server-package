<template>
  <LytForm>
    <a-layout style="position: fixed; top: 104px; bottom: 30px">
      <a-layout-sider width="30vw" :style="{ padding: '20px', background: '#ececec' }">
        <a-list :grid="{ gutter: 16, column: 2 }" :data-source="compos">
          <template #renderItem="{ item: compo }">
            <a-list-item>
              <CompoCard :compo="compo" />
            </a-list-item>
          </template>
        </a-list>
      </a-layout-sider>
      <a-layout-content :style="{ padding: '20px', width: '50vw' }" @click="active = ''">
        <a-form
          class="w-100"
          :model="formState"
          :label-col="{ span: 8 }"
          :wrapper-col="{ span: 16 }"
          autocomplete="off"
        >
          <template v-for="field in fields" :key="field.key">
            <a-form-item class="p-10" :class="{ 'mb-0 bd-form-item': field.key === active }">
              <template #label>
                <a v-if="field.key !== active" @click.stop="active = field.key">
                  {{ field.label }}
                </a>
                <p v-else class="mb-0">{{ field.label }}</p>
              </template>
              <a-input v-if="field.type === 'Input'" v-model:value="formState.username" disabled />
            </a-form-item>
            <div v-if="field.key === active" class="bd-form-oper">
              <a-button size="small" type="primary" class="br-0">
                <template #icon><DragOutlined /></template>
                &nbsp;移动
              </a-button>
              <a-button
                size="small"
                type="primary"
                danger
                class="br-0 mr-0"
                style="float: right"
                @click.stop="onFieldDel"
              >
                <template #icon><CloseOutlined /></template>
                &nbsp;删除
              </a-button>
            </div>
          </template>
        </a-form>
      </a-layout-content>
    </a-layout>
  </LytForm>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Compo from '@/types/compo'
import { createVNode, defineComponent, reactive, ref } from 'vue'
import LytForm from '../layouts/LytForm.vue'
import CompoCard from '../components/CompoCard.vue'
import { CloseOutlined, DragOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'
import { v4 as uuidv4 } from 'uuid'
import { Field } from '@/types/field'
import { Modal } from 'ant-design-vue'

export default defineComponent({
  name: 'Form',
  components: {
    LytForm,
    CompoCard,
    CloseOutlined,
    DragOutlined
  },
  setup() {
    const compos = reactive([
      reactive(Compo.copy({ name: 'Button' })),
      reactive(Compo.copy({ name: 'Icon' })),
      reactive(Compo.copy({ name: 'Input' })),
      reactive(Compo.copy({ name: 'Select' }))
    ])
    const fields = reactive([
      reactive(Field.copy({ key: uuidv4(), label: 'abcd', type: 'Input' })),
      reactive(Field.copy({ key: uuidv4(), label: 'abcd', type: 'Input' }))
    ])
    const formState = reactive({} as Record<string, any>)
    const active = ref('')

    function onFieldDel() {
      Modal.confirm({
        title: '确定删除该表单组件吗？',
        icon: createVNode(ExclamationCircleOutlined),
        content: '不可恢复！',
        okText: 'Yes',
        okType: 'danger',
        cancelText: 'No',
        onOk() {
          fields.splice(
            fields.findIndex(fld => fld.key === active.value),
            1
          )
          active.value = ''
        }
      })
    }
    return {
      compos,
      active,
      fields,
      formState,

      onFieldDel
    }
  }
})
</script>

<style lang="less">
.opera-btn {
  position: absolute;
  margin-right: 0;
  border-radius: 0;
  bottom: 1px;
}

.bd-form-item {
  border-top: 1px solid #108ee9;
  border-left: 1px solid #108ee9;
  border-right: 1px solid #108ee9;
}

.bd-form-oper {
  border-left: 1px solid #108ee9;
  border-right: 1px solid #108ee9;
  border-bottom: 1px solid #108ee9;
}
</style>
