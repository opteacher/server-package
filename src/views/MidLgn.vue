<template>
  <LytMiddle :active="`project/${pid}/mid/login`">
    <div
      v-if="!hasAuth"
      class="center-container"
      :style="{
        position: 'absolute',
        left: `${mnMask[0]}px`,
        top: `${mnMask[1]}px`,
        width: `${mnMask[2]}px`,
        height: `${mnMask[3]}px`,
        'background-color': '#000000AE',
        'z-index': 501
      }"
    >
      <a-tooltip>
        <template #title>登录页面需要依托权限系统</template>
        <a-button
          type="primary"
          size="large"
          @click="$router.push(`/server-package/project/${pid}/auth`)"
        >
          配置权限
        </a-button>
      </a-tooltip>
    </div>
    <div id="pnlMain">
      <a-descriptions title="登录页面参数" :column="4">
        <template #extra>
          <a-button :type="!lgnProps.equals(midLgn) ? 'primary' : 'default'" @click="onLoginSave">
            保存
          </a-button>
        </template>
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
            :multiple="false"
            :showUploadList="false"
            action="/server-package/api/v1/temp/image"
            @change="onUploadBkgdImg"
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
        <a-descriptions-item label="表单边距">
          <a-input
            :disabled="lgnProps.align === 'center'"
            size="small"
            style="width: 8vw"
            type="number"
            v-model:value="lgnProps.padding"
          >
            <template #suffix>px</template>
          </a-input>
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
        <!-- <a-descriptions-item label="注册选项">
          <a-switch
            v-model:checked="lgnProps.registerable"
            checked-children="可注册"
            un-checked-children="不可注册"
          />
        </a-descriptions-item> -->
        <a-descriptions-item label="标题">
          <a-input-group size="small">
            <a-row :gutter="8">
              <a-col :span="12">
                <a-input size="small" style="width: 100%" v-model:value="lgnProps.title" />
              </a-col>
              <a-col :span="12">
                <a-button size="small" @click="lgnProps.title = middle.title">
                  使用发布标题
                </a-button>
              </a-col>
            </a-row>
          </a-input-group>
        </a-descriptions-item>
        <a-descriptions-item label="记录历史账户">
          <a-switch
            v-model:checked="lgnProps.logAccount"
            checked-children="记录"
            un-checked-children="不记录"
          />
        </a-descriptions-item>
        <a-descriptions-item label="有无标签">
          <a-switch
            v-model:checked="lgnProps.hasLabel"
            checked-children="有"
            un-checked-children="无"
          />
        </a-descriptions-item>
        <a-descriptions-item label="标签宽度">
          <a-input size="small" style="width: 8vw" v-model:value="lgnProps.lblWidth" type="number">
            <template #suffix>/ 24</template>
          </a-input>
        </a-descriptions-item>
      </a-descriptions>
      <div
        :style="{
          position: 'absolute',
          left: `${dspMask[0]}px`,
          top: `${dspMask[1]}px`,
          width: `${dspMask[2]}px`,
          height: `${dspMask[3]}px`,
          opacity: 0,
          'z-index': 500
        }"
      />
      <div
        id="pnlDisplay"
        :style="{
          padding: `50px ${lgnProps.padding}px`,
          display: 'flex',
          'align-items': 'center',
          'justify-content': lgnProps.align,
          'background-image': lgnProps.background ? `url(${lgnProps.background})` : '',
          'background-color': lgnProps.bkgdColor
        }"
      >
        <div
          :style="{
            padding: '16px 20px 0 20px',
            'border-radius': `${lgnProps.radius}px`,
            width: `${lgnProps.width}%`,
            'background-color': lgnProps.fmBkgdColor
          }"
        >
          <h1 :style="{ 'font-size': '20pt', 'text-align': 'center', 'margin-bottom': '20px' }">
            {{ lgnProps.title }}
          </h1>
          <a-form
            :label-col="{ span: lgnProps.hasLabel ? lgnProps.lblWidth : 0 }"
            :wrapper-col="{ span: lgnProps.hasLabel ? 24 - lgnProps.lblWidth : 24 }"
          >
            <FormItem
              v-for="field in lgnFields"
              :key="field.key"
              :field="fixField(field)"
              :form="{}"
            />

            <a-form-item v-if="lgnProps.logAccount" name="remember">
              <a-checkbox>记住</a-checkbox>
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit">登录</a-button>
              <template v-if="lgnProps.registerable">
                &nbsp;或&nbsp;
                <a href="">前往注册</a>
              </template>
            </a-form-item>
          </a-form>
        </div>
      </div>
    </div>
  </LytMiddle>
</template>

<script lang="ts">
import { computed, defineComponent, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'
import LytMiddle from '../layouts/LytMiddle.vue'
import { UploadOutlined, PercentageOutlined } from '@ant-design/icons-vue'
import ColorField from '../components/table/ColorField.vue'
import MidLgn from '@/types/midLgn'
import { waitFor } from '@/utils'
import Form from '@/types/form'
import { mdlAPI } from '@/apis'
import FormItem from '@/components/form/FormItem.vue'
import Field from '@/types/field'
import { pjtAPI } from '@/apis'

export default defineComponent({
  name: 'MiddleLogin',
  components: {
    FormItem,
    LytMiddle,
    ColorField,
    UploadOutlined,
    PercentageOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const midLgn = computed(() => store.getters['project/ins'].middle.login)
    const lgnProps = reactive(new MidLgn())
    const mnRszObs = new ResizeObserver(() => onObsPnlResize('pnlMain', mnMask))
    const mnMask = reactive([0, 0, 0, 0])
    const dspRszObs = new ResizeObserver(() => onObsPnlResize('pnlDisplay', dspMask))
    const dspMask = reactive([0, 0, 0, 0])
    const hasAuth = computed(() => store.getters['project/ins'].auth.model as boolean)
    const lgnFields = reactive([] as Field[])
    const middle = computed(() => store.getters['project/middle'])

    onMounted(refresh)

    async function refresh() {
      await store.dispatch('project/refresh')
      const project = store.getters['project/ins']
      MidLgn.copy(project.middle.login, lgnProps)
      if (!project.auth.model) {
        mnRszObs.observe(await onObsPnlResize('pnlMain', mnMask))
      }
      dspRszObs.observe(await onObsPnlResize('pnlDisplay', dspMask))
      if (project.auth.model) {
        const model = await mdlAPI.detail(project.auth.model)
        const fldsMapper = Object.fromEntries(
          Form.copy(model.form).fields.map((field: Field) => [field.refer, field])
        )
        lgnFields.splice(0, lgnFields.length)
        for (const prop of project.auth.props) {
          lgnFields.push(fldsMapper[prop.name])
        }
      }
    }
    async function onObsPnlResize(key: string, rect: number[]) {
      const el = (await waitFor(key)) as HTMLElement
      rect[0] = el.offsetLeft
      rect[1] = el.offsetTop
      rect[2] = el.clientWidth
      rect[3] = el.clientHeight
      return el
    }
    function onBkgdColSubmit({ color, next }: { color: string; next: () => void }) {
      lgnProps.bkgdColor = color
      next()
    }
    function onFmBkgdColSubmit({ color, next }: { color: string; next: () => void }) {
      lgnProps.fmBkgdColor = color
      next()
    }
    async function onLoginSave() {
      await pjtAPI.middle.login.save(pid, lgnProps)
      await refresh()
    }
    function fixField(field: Field): Field {
      if (!lgnProps.hasLabel) {
        const ret = Field.copy(field)
        ret.label = ''
        return ret
      }
      return field
    }
    function onUploadBkgdImg(e: any) {
      if (e.file && e.file.status === 'done') {
        lgnProps.background = e.file.response.result
      }
    }
    return {
      Field,

      pid,
      midLgn,
      lgnProps,
      mnMask,
      dspMask,
      hasAuth,
      lgnFields,
      middle,

      onBkgdColSubmit,
      onFmBkgdColSubmit,
      onLoginSave,
      fixField,
      onUploadBkgdImg
    }
  }
})
</script>
