<template>
  <LytMiddle :active="`project/${pid}/mid/dashboard`">
    <a-row type="flex" :gutter="16" :style="{ height: mainHeight }">
      <a-col v-show="cmpExpand" flex="200px">
        <div class="ant-descriptions-title mb-20">组件库</div>
        <a-list :data-source="compos" :style="{ height: '60vh', 'overflow-y': 'auto' }">
          <template #renderItem="{ item }">
            <a-list-item class="b-0 pt-0">
              <a-card
                class="w-100 hover-pbd"
                size="small"
                :draggable="true"
                @dragstart="(e: any) => e.dataTransfer.setData('text/plain', item.name)"
              >
                {{ item.name }}
              </a-card>
            </a-list-item>
          </template>
        </a-list>
      </a-col>
      <a-col flex="0" class="p-0">
        <a-button
          :style="{
            height: '80px',
            padding: '5px',
            'z-index': 500,
            'border-top-left-radius': 0,
            'border-bottom-left-radius': 0
          }"
          @click="cmpExpand = !cmpExpand"
        >
          <template v-if="cmpExpand">
            收
            <br />
            起
            <br />
            <caret-left-outlined />
          </template>
          <template v-else>
            展
            <br />
            开
            <br />
            <caret-right-outlined />
          </template>
        </a-button>
      </a-col>
      <a-col flex="auto">
        <div
          class="h-100"
          :style="{
            'background-color': dsbProps.bkgdColor,
            padding: [
              dsbProps.padding[0] === -1 ? 'auto' : `${dsbProps.padding[0]}px`,
              dsbProps.padding[1] === -1 ? 'auto' : `${dsbProps.padding[1]}px`
            ].join(' ')
          }"
          @dragover="(e: any) => e.preventDefault()"
          @drop="onDropDownEmpty"
        >
          <a-empty v-if="!dsbProps.children.length">
            <template #description>从左侧的组件库中拖拽至此</template>
          </a-empty>
          <template v-else v-for="compo of dsbProps.children" :key="compo.key">
            <a-row v-if="compo.ctype === 'Row'"></a-row>
          </template>
        </div>
      </a-col>
      <a-col flex="300px">
        <a-descriptions v-if="!cmpProps.key" title="主配置" :column="1" size="small" bordered>
          <a-descriptions-item label="背景颜色">
            <ColorField :color="dsbProps.bkgdColor" @submit="onBkgdColSubmit" />
          </a-descriptions-item>
          <a-descriptions-item label="内边距">
            <a-input-group>
              <a-row :gutter="8">
                <a-col :span="12">
                  <a-input-number
                    class="w-100"
                    v-model:value="dsbProps.padding[0]"
                    :min="-1"
                    placeholder="上下边距"
                  />
                </a-col>
                <a-col :span="12">
                  <a-input-number
                    class="w-100"
                    v-model:value="dsbProps.padding[1]"
                    :min="-1"
                    placeholder="左右边距"
                  />
                </a-col>
              </a-row>
            </a-input-group>
          </a-descriptions-item>
        </a-descriptions>
      </a-col>
    </a-row>
  </LytMiddle>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import LytMiddle from '../layouts/LytMiddle.vue'
import ColorField from '../components/table/ColorField.vue'
import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons-vue'
import { cmpAPI } from '@/apis'
import CmpIns from '@/types/cmpIns'

export default defineComponent({
  name: 'MiddleDashboard',
  components: {
    LytMiddle,
    ColorField,

    CaretLeftOutlined,
    CaretRightOutlined
  },
  setup() {
    const route = useRoute()
    const pid = route.params.pid
    const mainHeight = ref('100%')
    const dsbProps = reactive({
      bkgdColor: '#FFFFFF',
      padding: [16, 16] as [number, number],
      children: [] as any[]
    })
    const compos = reactive([] as any[])
    const cmpExpand = ref(false)
    const cmpProps = reactive(new CmpIns())

    onMounted(async () => {
      const midOperBox = document.getElementById('midOperBox')
      const opBoxBtm = midOperBox ? midOperBox.getBoundingClientRect().bottom : 0
      mainHeight.value = `calc(100vh - ${opBoxBtm + 16 + 40}px)`

      compos.splice(0, compos.length, ...(await cmpAPI.all(0, 100)))
    })

    function onBkgdColSubmit({ color, next }: { color: string; next: () => void }) {
      dsbProps.bkgdColor = color
      next()
    }
    function onDropDownEmpty(e: DragEvent) {
      if (!e.dataTransfer) {
        return
      }
      const dragCompo = e.dataTransfer.getData('text/plain') as string
      dsbProps.children.push(new CmpIns(compos.find((cmp: any) => cmp.name === dragCompo)))
    }
    return {
      pid,
      dsbProps,
      mainHeight,
      compos,
      cmpExpand,
      cmpProps,

      onBkgdColSubmit,
      onDropDownEmpty
    }
  }
})
</script>
