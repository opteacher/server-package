<template>
  <LytMiddle :active="`project/${pid}/ds/login`">
    <a-descriptions title="登录页面参数" :column="4">
      <template #extra>
        <a-button type="primary">保存</a-button>
      </template>
      <a-descriptions-item>
        <template #label>
          展示高度&nbsp;
          <a-tooltip>
            <template #title>只用于编辑时展示，不影响线上页面</template>
            <info-circle-outlined />
          </a-tooltip>
        </template>
        <a-input size="small" style="width: 12vw" v-model:value="lgnProps.height" type="number">
          <template #suffix>px</template>
        </a-input>
      </a-descriptions-item>
      <a-descriptions-item label="背景颜色">
        <ColorField
          size="small"
          style="width: 12vw"
          :color="lgnProps.bkgdColor"
          @submit="onBkgdColSubmit"
        />
      </a-descriptions-item>
      <a-descriptions-item label="背景图片">
        <a-upload
          name="file"
          :maxCount="1"
          v-model:file-list="lgnProps.background"
          action="/server-package/api/v1/image"
          @change="onUpldImgChange"
        >
          <a-button size="small">
            <template #icon><upload-outlined /></template>
            上传图片
          </a-button>
        </a-upload>
      </a-descriptions-item>
      <a-descriptions-item label="表单位置">
        <a-select
          size="small"
          :options="[
            { label: '右对齐', value: 'right' },
            { label: '居中对齐', value: 'center' },
            { label: '左对齐', value: 'left' }
          ]"
          v-model:value="lgnProps.align"
        />
      </a-descriptions-item>
      <a-descriptions-item label="表单宽度">
        <a-input size="small" v-model:value="lgnProps.width" style="width: 12vw">
          <template #suffix><percentage-outlined /></template>
        </a-input>
      </a-descriptions-item>
      <a-descriptions-item label="表单背景">
        <ColorField
          size="small"
          style="width: 12vw"
          :color="lgnProps.fmBkgdColor"
          @submit="onFmBkgdColSubmit"
        />
      </a-descriptions-item>
      <a-descriptions-item label="表单圆角">
        <a-input size="small" style="width: 8vw" v-model:value="lgnProps.radius" type="number">
          <template #suffix>px</template>
        </a-input>
      </a-descriptions-item>
      <a-descriptions-item label="注册选项">
        <a-switch
          v-model:checked="lgnProps.registerable"
          checked-children="可注册"
          un-checked-children="不可注册"
        />
      </a-descriptions-item>
      <a-descriptions-item label="记录历史账户">
        <a-switch
          v-model:checked="lgnProps.logAccount"
          checked-children="记录"
          un-checked-children="不记录"
        />
      </a-descriptions-item>
    </a-descriptions>
    <div
      :style="{
        padding: '0 24px',
        height: `${lgnProps.height}px`,
        display: 'flex',
        'align-items': 'center',
        'justify-content': lgnProps.align,
        'background-color': lgnProps.bkgdColor
      }"
    >
      <a-form
        :style="{
          padding: '16px 20px 0 20px',
          'border-radius': `${lgnProps.radius}px`,
          width: `${lgnProps.width}%`,
          'background-color': lgnProps.fmBkgdColor
        }"
      >
        <a-form-item
          label="Username"
          name="username"
          :rules="[{ required: true, message: 'Please input your username!' }]"
        >
          <a-input />
        </a-form-item>

        <a-form-item
          label="Password"
          name="password"
          :rules="[{ required: true, message: 'Please input your password!' }]"
        >
          <a-input-password />
        </a-form-item>

        <a-form-item v-if="lgnProps.logAccount" name="remember">
          <a-checkbox>Remember me</a-checkbox>
        </a-form-item>

        <a-form-item>
          <a-button type="primary" html-type="submit">Submit</a-button>
          <template v-if="lgnProps.registerable">
            &nbsp;Or&nbsp;
            <a href="">register now!</a>
          </template>
        </a-form-item>
      </a-form>
    </div>
  </LytMiddle>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import LytMiddle from '../layouts/LytMiddle.vue'
import { UploadOutlined, PercentageOutlined, InfoCircleOutlined } from '@ant-design/icons-vue'
import ColorField from '../components/table/ColorField.vue'

export default defineComponent({
  name: 'DesignLogin',
  components: {
    LytMiddle,
    ColorField,
    UploadOutlined,
    PercentageOutlined,
    InfoCircleOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const lgnProps = reactive({
      bkgdColor: '#cdcdcd',
      background: [],
      width: 50,
      height: 300,
      align: 'center',
      radius: 0,
      fmBkgdColor: '#EFEFEF',
      registerable: false,
      logAccount: true
    })

    onMounted(() => store.dispatch('project/refresh'))

    function onUpldImgChange(e: { file: any }) {
      console.log(e.file)
    }
    function onBkgdColSubmit({ color, next }: { color: string; next: () => void }) {
      lgnProps.bkgdColor = color
      next()
    }
    function onFmBkgdColSubmit({ color, next }: { color: string; next: () => void }) {
      lgnProps.fmBkgdColor = color
      next()
    }
    return {
      pid,
      lgnProps,

      onUpldImgChange,
      onBkgdColSubmit,
      onFmBkgdColSubmit
    }
  }
})
</script>
