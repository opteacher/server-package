<template>
  <a-form-item v-show="validConds(valState.display)" :ref="skey" :name="skey">
    <template #label>
      {{ valState.label }}&nbsp;
      <a-tooltip v-if="valState.desc">
        <template #title>{{ valState.desc }}</template>
        <InfoCircleOutlined />
      </a-tooltip>
    </template>
    <template v-if="viewOnly">
      <template
        v-if="
          valState.type === 'Input' ||
          valState.type === 'Number' ||
          valState.type === 'Delable' ||
          valState.type === 'SelOrIpt' ||
          valState.type === 'DateTime'
        "
      >
        {{ formState[skey] }}
      </template>
      <template v-else-if="valState.type === 'Textarea' || valState.type === 'CodeEditor'">
        <pre>{{ formState[skey] }}</pre>
      </template>
      <template v-else-if="valState.type === 'Select' || valState.type === 'Cascader'">
        {{ fmtDrpdwnValue(valState.options, formState[skey]) }}
      </template>
      <template v-else-if="valState.type === 'Checkbox'">
        {{
          formState[skey]
            ? valState.chkLabels
              ? valState.chkLabels[1]
              : '是'
            : valState.chkLabels
            ? valState.chkLabels[0]
            : '否'
        }}
      </template>
      <template v-else-if="valState.type === 'Table'">
        <a-table
          v-show="formState[skey] && formState[skey].length"
          :columns="valState.columns"
          :data-source="formState[skey]"
          :pagination="false"
          size="small"
        />
      </template>
    </template>
    <template v-else-if="$slots[skey]">
      <slot :name="skey" v-bind="{ formState }" />
    </template>
    <template v-else>
      <a-input
        v-if="valState.type === 'Input'"
        v-model:value="formState[skey]"
        :type="valState.iptType || 'text'"
        :disabled="validConds(valState.disabled) || !editable"
        :addon-before="valState.prefix"
        :addon-after="valState.suffix"
        :placeholder="valState.placeholder || '请输入'"
        @change="(e: any) => valState.onChange(formState, e.target.value)"
      />
      <a-input-number
        v-else-if="valState.type === 'Number'"
        class="w-100"
        type="number"
        v-model:value="formState[skey]"
        :placeholder="valState.placeholder || '请输入'"
        :disabled="validConds(valState.disabled) || !editable"
        @change="(val: any) => valState.onChange(formState, val)"
      />
      <a-select
        v-else-if="valState.type === 'Select'"
        class="w-100"
        :options="valState.options"
        v-model:value="formState[skey]"
        :placeholder="valState.placeholder || '请选择'"
        :disabled="validConds(valState.disabled) || !editable"
        @dropdownVisibleChange="valState.onDropdown"
        @change="(val: any) => valState.onChange(formState, val)"
      >
        <template v-if="valState.loading" #notFoundContent>
          <a-spin size="small" />
        </template>
      </a-select>
      <a-tooltip v-else-if="valState.type === 'Checkbox'">
        <template #title>{{ valState.placeholder || '请确认' }}</template>
        <a-checkbox
          :name="skey"
          v-model:checked="formState[skey]"
          :disabled="validConds(valState.disabled) || !editable"
          @change="(val: any) => valState.onChange(formState, val)"
        >
          {{
            formState[skey]
              ? valState.chkLabels
                ? valState.chkLabels[1]
                : '是'
              : valState.chkLabels
              ? valState.chkLabels[0]
              : '否'
          }}
        </a-checkbox>
      </a-tooltip>
      <a-textarea
        v-else-if="valState.type === 'Textarea'"
        v-model:value="formState[skey]"
        :rows="valState.maxRows"
        :placeholder="valState.placeholder || '请输入'"
        :disabled="validConds(valState.disabled) || !editable"
        @change="(val: any) => valState.onChange(formState, val)"
      />
      <a-cascader
        v-else-if="valState.type === 'Cascader'"
        :options="valState.options"
        :placeholder="valState.placeholder || '请选择'"
        v-model:value="formState[skey]"
        change-on-select
        :disabled="validConds(valState.disabled) || !editable"
        @change="(e: any) => valState.onChange(formState, e)"
      />
      <a-tooltip v-else-if="valState.type === 'Button'">
        <template #title>{{ valState.placeholder || '请点击' }}</template>
        <a-button
          class="w-100"
          :disabled="validConds(valState.disabled) || !editable"
          :danger="valState.danger"
          :type="valState.primary ? 'primary' : 'default'"
          ghost
          :loading="valState.loading"
          @click="() => valState.onClick(formState)"
        >
          {{ valState.inner }}
        </a-button>
      </a-tooltip>
      <a-date-picker
        v-else-if="valState.type === 'DateTime'"
        class="w-100"
        show-time
        :placeholder="valState.placeholder || '请选择'"
        :disabled="validConds(valState.disabled) || !editable"
        v-model:value="formState[skey]"
      />
      <template v-else-if="valState.type === 'Table'">
        <a-space>
          <a-button
            v-if="validConds(valState.addable)"
            type="primary"
            @click="
              () => {
                valState.emitter.emit('viewOnly', false)
                valState.show = true
                valState.onEdit(formState)
              }
            "
          >
            新增
          </a-button>
          <slot name="FormDialog" />
          <a-typography-text type="secondary">
            <InfoCircleOutlined />
            {{ valState.placeholder || '点击添加' }}
          </a-typography-text>
        </a-space>
        <a-table
          class="mt-5"
          v-show="formState[skey] && formState[skey].length"
          :columns="valState.columns.concat([new Column('操作', 'opera', { width: 80 })])"
          :data-source="formState[skey]"
          :pagination="false"
          size="small"
          :custom-row="
                  (record: any) => ({
                    onClick: () => {
                      valState.emitter.emit('viewOnly', !valState.edtable)
                      valState.show = true
                      valState.emitter.emit('update:data', record)
                      valState.onEdit(formState)
                    }
                  })
                "
        >
          <template v-if="validConds(valState.delable)" #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'opera'">
              <a-popconfirm
                title="确定删除该字段"
                @confirm.stop="valState.onDeleted(record.key, formState[skey])"
              >
                <a-button danger size="small" @click.stop="() => {}">删除</a-button>
              </a-popconfirm>
            </template>
          </template>
        </a-table>
      </template>
      <template v-else-if="valState.type === 'Upload'">
        <a-dropdown class="w-100" :disabled="validConds(valState.disabled) || !editable">
          <a-button>
            <template #icon><UploadOutlined /></template>
            选择上传的文件或文件夹
          </a-button>
          <template #overlay>
            <a-upload
              name="file"
              :multiple="false"
              :directory="uploadDir"
              :showUploadList="false"
              v-model:file-list="formState[skey]"
              action="/server-package/api/v1/temp/file"
              @change="(info: any) => valState.onChange(formState, info)"
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
          v-show="formState[skey].length"
          style="margin-top: 5px"
          size="small"
          :data-source="formState[skey]"
        >
          <template #renderItem="{ item: file }">
            <a-list-item>
              {{ file.originFileObj.webkitRelativePath || file.name }}
            </a-list-item>
          </template>
        </a-list>
      </template>
      <a-space v-else-if="valState.type === 'Delable'">
        {{ formState[skey] || '-' }}
        <CloseCircleOutlined @click="valState.onDeleted(formState.key)" />
      </a-space>
      <a-row v-else-if="valState.type === 'SelOrIpt'" type="flex">
        <a-col flex="auto">
          <a-select
            v-if="valState.mode === 'select'"
            style="width: 98%"
            :options="valState.options"
            v-model:value="formState[skey]"
            :placeholder="valState.placeholder || '请选择'"
            :disabled="validConds(valState.disabled) || !editable"
          />
          <a-input
            v-else
            style="width: 98%"
            :placeholder="valState.placeholder || '请输入'"
            v-model:value="formState[skey]"
            :disabled="validConds(valState.disabled) || !editable"
          />
        </a-col>
        <a-col flex="32px">
          <a-button
            @click="
              () => {
                valState.mode = valState.mode === 'select' ? 'input' : 'select'
              }
            "
            :disabled="validConds(valState.disabled) || !editable"
          >
            <template #icon>
              <SelectOutlined v-if="valState.mode === 'select'" />
              <EditOutlined v-else />
            </template>
          </a-button>
        </a-col>
      </a-row>
      <a-form-item-rest v-else-if="valState.type === 'ListSelect'">
        <a-list
          item-layout="horizontal"
          :data-source="valState.options"
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
                  :checked="formState[skey].includes(option.key)"
                  @change="(e: any) => onLstSelChecked(e.target.checked, skey as string, option.key)"
                />
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-form-item-rest>
      <template v-else-if="valState.type === 'List'">
        <a-button
          v-if="!valState.addMod"
          class="w-100"
          type="primary"
          ghost
          @click="onEdtLstShow(skey, valState)"
        >
          添加{{ valState.label }}
        </a-button>
        <a-list
          v-show="formState[skey] && formState[skey].length"
          style="margin-top: 5px"
          size="small"
          :data-source="formState[skey]"
        >
          <template #renderItem="{ item, index }">
            <a-list-item>
              <template #actions>
                <template v-if="valState.addMod && !index">
                  <a @click="onEdtLstAdded(skey, valState)">确定</a>
                  <a @click="onEdtLstDeled(skey, valState)">取消</a>
                </template>
                <a v-else @click="formState[skey].splice(index, 1)">删除</a>
              </template>
              <template v-if="valState.addMod && !index">
                <a-select
                  v-if="valState.mode === 'select'"
                  class="w-100"
                  :options="valState.options"
                  v-model:value="formState[skey][0]"
                />
                <a-input v-else v-model:value="formState[skey][0]" />
              </template>
              <template v-else>
                <template v-if="valState.mode === 'select'">
                  {{ valState.options.find((opn: any) => opn.value === item).label }}
                </template>
                <template v-else>{{ item }}</template>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </template>
      <VueAceEditor
        v-else-if="valState.type === 'CodeEditor'"
        v-model:value="formState[skey]"
        :disabled="validConds(valState.disabled) || !editable"
      />
      <template v-else>
        {{ formState[skey] }}
      </template>
    </template>
  </a-form-item>
</template>

<script lang="ts">
import { Cond, OpnType } from '@/types'
import Column from '@/types/column'
import { defineComponent, reactive, ref, watch } from 'vue'
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
import { getCopy } from '@/types/mapper'
import VueAceEditor from './VueAceEditor.vue'

export default defineComponent({
  name: 'FormItem',
  components: {
    InfoCircleOutlined,
    UploadOutlined,
    FileAddOutlined,
    FolderAddOutlined,
    CloseCircleOutlined,
    SelectOutlined,
    EditOutlined,
    AppstoreOutlined,

    VueAceEditor
  },
  props: {
    form: { type: Object, required: true },
    skey: { type: String, required: true },
    value: { type: Object, required: true },
    editable: { type: Boolean, default: true },
    viewOnly: { type: Boolean, default: false }
  },
  setup(props) {
    const formState = reactive(props.form)
    const valState = reactive(props.value)
    const uploadDir = ref(false)

    watch(
      () => props.value,
      () => {
        getCopy(props.value, valState)
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
            opns = opn.children as OpnType[]
            vals.push(opn.label || opn.value)
          } else {
            vals.push(value[i])
          }
          if (i === value.length - 1) {
            break
          }
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
          formState[propKey].push(opnKey)
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
    function onUploadClicked(item: { key: string }) {
      if (item.key === 'folder') {
        uploadDir.value = true
      } else {
        uploadDir.value = false
      }
    }
    return {
      Column,

      formState,
      valState,
      uploadDir,

      validConds,
      fmtDrpdwnValue,
      onLstSelChecked,
      onEdtLstAdded,
      onEdtLstDeled,
      onEdtLstShow,
      onUploadClicked
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
