<template>
<a-modal
  :visible="show"
  :title="title"
  :width="width"
  :confirmLoading="!editable"
  @ok="onOkClick"
  @cancel="onCclClick"
>
  <a-form
    ref="formRef"
    :model="formState"
    :rules="formRules"
    :label-col="{ span: column[0] }"
    :wrapper-col="{ span: column[1] }"
  >
    <template v-for="(value, key) in formMapper" :key="key">
      <a-form-item v-show="isDisplay(key)" :ref="key" :name="key">
        <template #label>
          {{value.label}}&nbsp;
          <a-tooltip v-if="value.desc">
            <template #title>{{value.desc}}</template>
            <InfoCircleOutlined />
          </a-tooltip>
        </template>
        <a-input
          v-if="value.type === 'Input'"
          v-model:value="formState[key]"
          :disabled="value.disabled || !editable"
          @change="(e) => value.onChange(formState, e.target.value)"
        />
        <a-input-number
          v-else-if="value.type === 'Number'"
          class="w-100"
          v-model:value="formState[key]"
          :disabled="value.disabled || !editable"
          @change="(val) => value.onChange(formState, val)"
        />
        <a-select
          v-else-if="value.type === 'Select'"
          class="w-100"
          v-model:value="formState[key]"
          :disabled="value.disabled || !editable"
          @change="(val) => value.onChange(formState, val)"
        >
          <a-select-option
            v-for="item in value.options"
            :key="typeof item === 'string' ? item : item.value"
            :value="typeof item === 'string' ? item : item.value"
          >
            {{typeof item === 'string' ? item : item.title}}
            <span
              v-if="typeof item !== 'string' && item.subTitle"
              style="float: right"
            >
              {{item.subTitle}}
            </span>
          </a-select-option>
        </a-select>
        <a-checkbox
          v-else-if="value.type === 'Checkbox'"
          :name="key"
          v-model:checked="formState[key]"
          :disabled="value.disabled || !editable"
          @change="(val) => value.onChange(formState, val)"
        >
          {{formState[key]
            ? (value.chkLabels ? value.chkLabels[1] : '是')
            : (value.chkLabels ? value.chkLabels[0] : '否')}}
        </a-checkbox>
        <a-textarea
          v-else-if="value.type === 'Textarea'"
          v-model:value="formState[key]"
          :rows="4"
          :disabled="value.disabled || !editable"
          @change="(val) => value.onChange(formState, val)"
        />
        <a-cascader
          v-else-if="value.type === 'Cascader'"
          :options="value.options"
          v-model:value="formState[key]"
          :disabled="value.disabled || !editable"
          @change="(e) => value.onChange(formState, e.target)"
        />
        <a-button
          v-else-if="value.type === 'Button'"
          class="w-100"
          :disabled="value.disabled || !editable"
          :danger="value.danger"
          :loading="value.loading"
          @click="() => value.onClick(formState)"
        >{{ value.inner }}</a-button>
        <a-form-item-rest
          v-else-if="value.type === 'Table'"
        >
          <EditableTable
            class="w-100"
            size="small"
            :dsKey="value.dsKey"
            :copy="value.copy"
            :mapper="value.mapper"
            :columns="value.columns"
            :emitter="tblEmitter"
            @save="async (editing) => {
              await value.onSaved(editing)
              tblEmitter.emit('refresh')
            }"
            @delete="value.onDeleted"
          />
        </a-form-item-rest>
        <template v-else-if="value.type === 'Upload'">
          <a-dropdown class="w-100" :disabled="!editable">
            <a-button>
              <UploadOutlined/>&nbsp;选择上传的文件或文件夹
            </a-button>
            <template #overlay>
              <a-upload
                name="file"
                :multiple="false"
                :directory="upldDir"
                :showUploadList="false"
                v-model:file-list="formState[key]"
                action="/server-package/api/v1/temp/file"
                @change="(info) => value.onChange(formState, info)"
              >
                <a-menu @click="onUploadClicked">
                  <a-menu-item key="file">
                    <FileAddOutlined/>&nbsp;上传文件
                  </a-menu-item>
                  <a-menu-item key="folder">
                    <FolderAddOutlined />&nbsp;上传文件夹
                  </a-menu-item>
                </a-menu>
              </a-upload>
            </template>
          </a-dropdown>
          <a-list
            v-show="formState[key].length"
            style="margin-top: 5px"
            size="small"
            :data-source="formState[key]"
          >
            <template #renderItem="{ item: file }">
              <a-list-item>
                {{ file.originFileObj.webkitRelativePath || file.name }}
              </a-list-item>
            </template>
          </a-list>
        </template>
      </a-form-item>
    </template>
  </a-form>
</a-modal>
</template>

<script lang="ts">
import { Cond, Mapper } from '@/common'
import { defineComponent, reactive, ref, watch } from 'vue'
import { InfoCircleOutlined, UploadOutlined, FileAddOutlined, FolderAddOutlined } from '@ant-design/icons-vue'
import EditableTable from './EditableTable.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { getProperty } from '@/utils'

export default defineComponent({
  name: 'FormDialog',
  components: {
    EditableTable,
    InfoCircleOutlined,
    UploadOutlined,
    FileAddOutlined,
    FolderAddOutlined
  },
  props: {
    show: { type: Boolean, required: true },
    copy: { type: Function, required: true },
    width: { type: String, default: '50vw' },
    column: { type: Array, default: () => [4, 20] }, // [0]标题宽度 [1]表单项宽度
    title: { type: String, default: 'Form Dialog' },
    object: { type: Object, default: null },
    mapper: { type: Mapper, required: true },
    emitter: { type: Emitter, default: null }
  },
  emits: [
    'update:show',
    'submit'
  ],
  setup (props, { emit }) {
    const formRef = ref()
    const formState = reactive(props.object || props.copy({}))
    const formRules = Object.fromEntries(
      Object.entries(props.mapper).map((entry) => {
        return [entry[0], entry[1].rules]
      })
    )
    const formMapper = reactive(props.mapper)
    const editable = ref(true)
    const tblEmitter = new Emitter()
    const upldDir = ref(false)

    if (props.emitter) {
      props.emitter.on('editable', (edtb: boolean) => {
        editable.value = edtb
      })
      props.emitter.on('update:show', (show: boolean) => {
        emit('update:show', show)
      })
    }

    function isDisplay (key: string): boolean {
      const display = props.mapper[key].display
      if (typeof display === 'boolean') {
        return display as boolean
      } else {
        return (display as Cond).isValid(formState)
      }
    }
    async function onOkClick () {
      try {
        await formRef.value.validate()
        emit('submit', formState, () => {
          formRef.value.resetFields()
          formState.reset()
        })
        emit('update:show', false)
      } catch (e) {
        console.log(e)
      }
    }
    function onCclClick () {
      formRef.value.resetFields()
      formState.reset()
      emit('update:show', false)
    }
    function onUploadClicked (item: { key: string }) {
      if (item.key === 'folder') {
        upldDir.value = true
      } else {
        upldDir.value = false
      }
    }
    return {
      formRef,
      formState,
      formRules,
      formMapper,
      editable,
      tblEmitter,
      upldDir,

      onOkClick,
      onCclClick,
      isDisplay,
      onUploadClicked
    }
  }
})
</script>

<style lang="less" scoped>
.w-100 {
  width: 100%;
}
</style>
