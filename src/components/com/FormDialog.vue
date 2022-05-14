<template>
  <a-modal
    :visible="show"
    :title="title"
    :width="width"
    :confirmLoading="!editable"
    :footer="viewOnly ? null : undefined"
    @cancel="onCclClick"
  >
    <template #footer>
      <a-button type="default" @click="onCclClick">取消</a-button>
      <a-button type="primary" @click="onOkClick">确定</a-button>
    </template>
    <a-form
      ref="formRef"
      :model="formState"
      :rules="formRules"
      :label-col="{ span: column[0] }"
      :wrapper-col="{ span: column[1] }"
    >
      <template v-for="(value, key) in formMapper" :key="key">
        <a-form-item v-show="validConds(value.display)" :ref="key" :name="key">
          <template #label>
            {{ value.label }}&nbsp;
            <a-tooltip v-if="value.desc">
              <template #title>{{ value.desc }}</template>
              <InfoCircleOutlined />
            </a-tooltip>
          </template>
          <template v-if="viewOnly">
            <template
              v-if="
                value.type === 'Input' ||
                value.type === 'Number' ||
                value.type === 'Delable' ||
                value.type === 'SelOrIpt' ||
                value.type === 'DateTime'
              "
            >
              {{ formState[key] }}
            </template>
            <template v-else-if="value.type === 'Textarea'">
              <pre>{{ formState[key] }}</pre>
            </template>
            <template v-else-if="value.type === 'Select' || value.type === 'Cascader'">
              {{ fmtDrpdwnValue(value.options, formState[key]) }}
            </template>
            <template v-else-if="value.type === 'Checkbox'">
              {{
                formState[key]
                  ? value.chkLabels
                    ? value.chkLabels[1]
                    : '是'
                  : value.chkLabels
                  ? value.chkLabels[0]
                  : '否'
              }}
            </template>
            <template v-else-if="value.type === 'Table'">
              <a-table
                v-show="formState[key] && formState[key].length"
                :columns="value.columns"
                :data-source="formState[key]"
                :pagination="false"
                size="small"
              />
            </template>
          </template>
          <template v-else>
            <a-input
              v-if="value.type === 'Input'"
              v-model:value="formState[key]"
              :type="value.iptType || 'text'"
              :disabled="validConds(value.disabled) || !editable"
              :addon-before="value.prefix"
              :addon-after="value.suffix"
              @change="e => value.onChange(formState, e.target.value)"
            />
            <a-input-number
              v-else-if="value.type === 'Number'"
              class="w-100"
              v-model:value="formState[key]"
              :disabled="validConds(value.disabled) || !editable"
              @change="val => value.onChange(formState, val)"
            />
            <a-select
              v-else-if="value.type === 'Select'"
              class="w-100"
              :options="value.options"
              v-model:value="formState[key]"
              :disabled="validConds(value.disabled) || !editable"
              @dropdownVisibleChange="value.onDropdown"
              @change="val => value.onChange(formState, val)"
            >
              <template v-if="value.loading" #notFoundContent>
                <a-spin size="small" />
              </template>
            </a-select>
            <a-checkbox
              v-else-if="value.type === 'Checkbox'"
              :name="key"
              v-model:checked="formState[key]"
              :disabled="validConds(value.disabled) || !editable"
              @change="val => value.onChange(formState, val)"
            >
              {{
                formState[key]
                  ? value.chkLabels
                    ? value.chkLabels[1]
                    : '是'
                  : value.chkLabels
                  ? value.chkLabels[0]
                  : '否'
              }}
            </a-checkbox>
            <a-textarea
              v-else-if="value.type === 'Textarea'"
              v-model:value="formState[key]"
              :rows="value.maxRows"
              :disabled="validConds(value.disabled) || !editable"
              @change="val => value.onChange(formState, val)"
            />
            <a-cascader
              v-else-if="value.type === 'Cascader'"
              :options="value.options"
              v-model:value="formState[key]"
              :disabled="validConds(value.disabled) || !editable"
              @change="e => value.onChange(formState, e)"
            />
            <a-button
              v-else-if="value.type === 'Button'"
              class="w-100"
              :disabled="validConds(value.disabled) || !editable"
              :danger="value.danger"
              :type="value.primary ? 'primary' : 'default'"
              ghost
              :loading="value.loading"
              @click="() => value.onClick(formState)"
            >
              {{ value.inner }}
            </a-button>
            <a-date-picker
              v-else-if="value.type === 'DateTime'"
              class="w-100"
              show-time
              :disabled="validConds(value.disabled) || !editable"
              v-model:value="formState[key]"
            />
            <template v-else-if="value.type === 'Table'">
              <a-button
                v-if="validConds(value.addable)"
                type="primary"
                @click="
                  () => {
                    value.emitter.emit('viewOnly', false)
                    value.show = true
                  }
                "
              >
                新增
              </a-button>
              <FormDialog
                :show="value.show"
                :mapper="value.mapper"
                :copy="value.copy"
                :emitter="value.emitter"
                :object="value.editing"
                @update:show="value.show = false"
                @submit="value.onSaved"
              />
              <a-table
                class="mt-3"
                v-show="formState[key] && formState[key].length"
                :columns="value.columns.concat([new Column('操作', 'opera', { width: 80 })])"
                :data-source="formState[key]"
                :pagination="false"
                size="small"
                :custom-row="
                  record => ({
                    onClick: () => {
                      value.emitter.emit('viewOnly', !value.edtable)
                      value.show = true
                      value.emitter.emit('update:data', record)
                    }
                  })
                "
              >
                <template v-if="validConds(value.delable)" #bodyCell="{ column, record }">
                  <template v-if="column.dataIndex === 'opera'">
                    <a-popconfirm
                      title="确定删除该字段"
                      @confirm.stop="value.onDeleted(record.key)"
                    >
                      <a-button danger size="small" @click.stop="() => {}">删除</a-button>
                    </a-popconfirm>
                  </template>
                </template>
              </a-table>
            </template>
            <template v-else-if="value.type === 'Upload'">
              <a-dropdown class="w-100" :disabled="validConds(value.disabled) || !editable">
                <a-button>
                  <UploadOutlined />
                  &nbsp;选择上传的文件或文件夹
                </a-button>
                <template #overlay>
                  <a-upload
                    name="file"
                    :multiple="false"
                    :directory="upldDir"
                    :showUploadList="false"
                    v-model:file-list="formState[key]"
                    action="/server-package/api/v1/temp/file"
                    @change="info => value.onChange(formState, info)"
                  >
                    <a-menu @click="onUploadClicked">
                      <a-menu-item key="file">
                        <FileAddOutlined />
                        &nbsp;上传文件
                      </a-menu-item>
                      <a-menu-item key="folder">
                        <FolderAddOutlined />
                        &nbsp;上传文件夹
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
            <a-space v-else-if="value.type === 'Delable'">
              {{ formState[key] || '-' }}
              <CloseCircleOutlined @click="value.onDeleted(formState.key)" />
            </a-space>
            <a-row v-else-if="value.type === 'SelOrIpt'" type="flex">
              <a-col flex="auto">
                <a-select
                  v-if="value.mode === 'select'"
                  style="width: 98%"
                  :options="value.options"
                  v-model:value="formState[key]"
                  :disabled="validConds(value.disabled) || !editable"
                />
                <a-input
                  v-else
                  style="width: 98%"
                  v-model:value="formState[key]"
                  :disabled="validConds(value.disabled) || !editable"
                />
              </a-col>
              <a-col flex="32px">
                <a-button
                  @click="
                    () => {
                      value.mode = value.mode === 'select' ? 'input' : 'select'
                    }
                  "
                  :disabled="validConds(value.disabled) || !editable"
                >
                  <template #icon>
                    <SelectOutlined v-if="value.mode === 'select'" />
                    <EditOutlined v-else />
                  </template>
                </a-button>
              </a-col>
            </a-row>
            <a-form-item-rest v-else-if="value.type === 'ListSelect'">
              <a-list
                item-layout="horizontal"
                :data-source="value.options"
                size="small"
                bordered
                :style="{
                  'max-height': '200px',
                  'overflow-y': 'auto'
                }"
              >
                <template #renderItem="{ item: option }">
                  <a-list-item>
                    <a-list-item-meta :description="option.subTitle">
                      <template #title>
                        <a v-if="option.href" :href="option.href">{{ option.title }}</a>
                        <p class="mb-0" v-else>{{ option.title }}</p>
                      </template>
                      <template #avatar>
                        <a-avatar :src="option.avatar">
                          <template v-if="!option.avatar" #icon>
                            <AppstoreOutlined />
                          </template>
                        </a-avatar>
                      </template>
                    </a-list-item-meta>
                    <template #actions>
                      <a-checkbox
                        :checked="formState[key].map(itm => itm.key).includes(option.key)"
                        @change="e => onLstSelChecked(e.target.checked, key, option.key)"
                      />
                    </template>
                  </a-list-item>
                </template>
              </a-list>
            </a-form-item-rest>
            <template v-else-if="value.type === 'EditList'">
              <a-button class="w-100" type="primary" ghost @click="onEdtLstShow(key, value)">
                添加{{ value.label }}
              </a-button>
              <a-list
                v-show="formState[key].length"
                style="margin-top: 5px"
                size="small"
                :data-source="formState[key]"
              >
                <template #renderItem="{ item, index }">
                  <a-list-item>
                    <template #actions>
                      <template v-if="value.addMod && !index">
                        <a @click="onEdtLstAdded(key, value)">确定</a>
                        <a @click="onEdtLstDeled(key, value)">取消</a>
                      </template>
                      <a v-else @click="formState[key].splice(index, 1)">删除</a>
                    </template>
                    <template v-if="value.addMod && !index">
                      <a-select
                        v-if="value.mode === 'select'"
                        class="w-100"
                        :options="value.options"
                        v-model:value="formState[key][0]"
                      />
                      <a-input v-else v-model:value="formState[key][0]" />
                    </template>
                    <template v-else>
                      <template v-if="value.mode === 'select'">
                        {{ value.options.find(opn => opn.value === item).label }}
                      </template>
                      <template v-else>{{ item }}</template>
                    </template>
                  </a-list-item>
                </template>
              </a-list>
            </template>
          </template>
        </a-form-item>
      </template>
    </a-form>
  </a-modal>
</template>

<script lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
import Column from '@/types/column'
import Mapper from '@/types/mapper'
import { Cond, OpnType } from '@/types'
import { defineComponent, onMounted, reactive, ref, watch } from 'vue'
import {
  InfoCircleOutlined,
  UploadOutlined,
  FileAddOutlined,
  FolderAddOutlined,
  CloseCircleOutlined,
  SelectOutlined,
  EditOutlined,
  AppstoreOutlined
} from '@ant-design/icons-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'

export default defineComponent({
  name: 'FormDialog',
  components: {
    InfoCircleOutlined,
    UploadOutlined,
    FileAddOutlined,
    FolderAddOutlined,
    CloseCircleOutlined,
    SelectOutlined,
    EditOutlined,
    AppstoreOutlined
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
  emits: ['initialize', 'update:show', 'submit'],
  setup(props, { emit }) {
    const formRef = ref()
    const formState = reactive(props.copy(props.object || {}))
    const formRules = Object.fromEntries(
      Object.entries(props.mapper).map(entry => {
        return [entry[0], entry[1].rules]
      })
    )
    const formMapper = reactive(props.mapper)
    const editable = ref(true)
    const upldDir = ref(false)
    const viewOnly = ref(false)

    if (props.emitter) {
      props.emitter.on('editable', (edtb: boolean) => {
        editable.value = edtb
      })
      props.emitter.on('update:show', (show: boolean) => {
        emit('update:show', show)
      })
      props.emitter.on('update:data', (data: any) => {
        props.copy(data, formState)
      })
      props.emitter.on('update:mapper', (mapper: any) => {
        Mapper.copy(mapper, formMapper)
      })
      props.emitter.on('viewOnly', (vwOnly: boolean) => {
        viewOnly.value = vwOnly
      })
    }
    onMounted(() => emit('initialize'))
    watch(
      () => props.show,
      (show: boolean) => {
        if (show && props.object) {
          props.copy(props.object, formState)
        }
      }
    )

    function validConds(value: boolean | Cond[] | { [cmpRel: string]: Cond[] }): boolean {
      if (typeof value === 'boolean') {
        return value as boolean
      } else if (value && value.length) {
        return (value as Cond[])
          .map((cond: Cond) => cond.isValid(formState))
          .reduce((a: boolean, b: boolean) => a && b)
      } else {
        let ret = 'OR' in value ? true : false
        for (const [cmpRel, conds] of Object.entries(value)) {
          ret =
            ret &&
            (conds as Cond[])
              .map((cond: Cond) => cond.isValid(formState))
              .reduce((a: boolean, b: boolean) => {
                switch (cmpRel) {
                  case 'OR':
                    return a || b
                  case 'AND':
                  default:
                    return a && b
                }
              })
        }
        return ret
      }
    }
    async function onOkClick() {
      try {
        await formRef.value.validate()
        emit('submit', formState, () => {
          formRef.value.resetFields()
          formState.reset && formState.reset()
          emit('update:show', false)
        })
      } catch (e) {
        console.log(e)
      }
    }
    function onCclClick() {
      formRef.value.resetFields()
      formState.reset && formState.reset()
      emit('update:show', false)
    }
    function onUploadClicked(item: { key: string }) {
      if (item.key === 'folder') {
        upldDir.value = true
      } else {
        upldDir.value = false
      }
    }
    function fmtDrpdwnValue(options: OpnType[], value: any | any[]) {
      if (value instanceof Array) {
        const vals = []
        if (!options || !options.length) {
          return value.join(' / ')
        }
        let opns = options
        for (let i = 0; i < value.length; ++i) {
          const opn = opns.find((opn: OpnType) => opn.value === value[i])
          if (opn) {
            vals.push(opn.label || opn.value)
          } else {
            vals.push(value[i])
          }
          if (i === value.length - 1) {
            break
          }
          opns = opn?.children as OpnType[]
        }
        return vals.join(' / ')
      } else {
        const opn = options.find((opn: OpnType) => opn.value === value)
        return opn ? opn.label || opn.value : value
      }
    }
    function onLstSelChecked(chk: boolean, propKey: string, opnKey: string) {
      const selKeys = formState[propKey].map((itm: any) => itm.key)
      if (chk) {
        if (!selKeys.includes(opnKey)) {
          formState[propKey].push({ key: opnKey })
        }
      } else {
        formState[propKey].splice(selKeys.indexOf(opnKey), 1)
      }
    }
    function onEdtLstAdded(key: string | number, value: any) {
      if (!formState[key][0]) {
        return
      }
      formState[key].push(formState[key][0])
      formState[key].shift()
      value.addMod = false
    }
    function onEdtLstDeled(key: string | number, value: any) {
      formState[key].shift()
      value.addMod = false
    }
    function onEdtLstShow(key: string | number, value: any) {
      formState[key].unshift('')
      value.addMod = true
    }
    return {
      Column,

      formRef,
      formState,
      formRules,
      formMapper,
      editable,
      upldDir,
      viewOnly,

      onOkClick,
      onCclClick,
      validConds,
      onUploadClicked,
      fmtDrpdwnValue,
      onLstSelChecked,
      onEdtLstAdded,
      onEdtLstDeled,
      onEdtLstShow
    }
  }
})
</script>

<style lang="less">
.w-100 {
  width: 100%;
}

.dynamic-delete-button {
  cursor: pointer;
  position: relative;
  top: 4px;
  font-size: 24px;
  color: #999;
  transition: all 0.3s;
}
.dynamic-delete-button:hover {
  color: #777;
}
</style>
