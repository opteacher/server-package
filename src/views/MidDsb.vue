<template>
  <LytMiddle :active="`project/${pid}/mid/dashboard`">
    <a-row type="flex" :gutter="16" :style="{ height: mainHeight }">
      <a-col v-show="tlbxExpand.left" flex="2" class="border mb-6 flex flex-col">
        <div class="my-2.5 flex justify-between">
          <div class="ant-descriptions-title">组件库</div>
          <a-switch
            v-model:checked="dspAllCmps"
            checked-children="所有"
            un-checked-children="展示类"
            @change="onDspCmpSwitch"
          />
        </div>
        <a-list :data-source="dspCmps" class="flex-auto overflow-y-auto">
          <template #renderItem="{ item: compo }">
            <a-list-item class="border-0 pt-0">
              <a-card
                class="w-full cursor-pointer"
                size="small"
                :draggable="true"
                @dragstart="(e: DragEvent) => onCmpDragStart(e, compo.name)"
              >
                {{ cmpLblMap[compo.name as CompoType] || compo.name }}
              </a-card>
            </a-list-item>
          </template>
        </a-list>
      </a-col>
      <a-col flex="0" class="p-0">
        <a-button
          class="h-20 p-1.5 z-50 rounded-tl-none rounded-bl-none border-l border-white"
          @click="() => onToolboxExpand('left')"
        >
          <template v-if="tlbxExpand.left">
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
      <a-col flex="5" ref="dsbCtnr" @click="cmpProps.reset()">
        <div class="w-full mb-6" :style="{ height: mainHeight }">
          <div
            class="h-full overflow-auto border rounded relative"
            :style="{
              'background-color': dsbProps.bkgdColor,
              padding: [
                dsbProps.padding[0] === -1 ? 'auto' : `${dsbProps.padding[0]}px`,
                dsbProps.padding[1] === -1 ? 'auto' : `${dsbProps.padding[1]}px`
              ].join(' ')
            }"
            @dragover="(e: any) => e.preventDefault()"
            @drop="onDropOnEmpty"
          >
            <a-empty v-if="!dsbProps.children.length">
              <template #description>从左侧的组件库中拖拽至此</template>
            </a-empty>
            <template v-else>
              <CompoCard
                v-for="cmpIns of dsbProps.children"
                :key="cmpIns.key"
                :cmpIns="cmpIns"
                :actKey="cmpProps.key"
                @click="(clkCmp: any) => CmpIns.copy(clkCmp, cmpProps, true)"
                @dragenter="onCmpInsDragEnter"
                @dragleave="onCmpInsDragLeave"
                @drop="onDropInContainer"
                @refresh="refresh"
              />
            </template>
          </div>
        </div>
      </a-col>
      <a-col flex="0" class="p-0">
        <a-button
          class="h-20 p-1.5 z-50 rounded-tr-none rounded-br-none border-l border-white"
          @click="() => onToolboxExpand('right')"
        >
          <template v-if="tlbxExpand.right">
            收
            <br />
            起
            <br />
            <caret-right-outlined />
          </template>
          <template v-else>
            展
            <br />
            开
            <br />
            <caret-left-outlined />
          </template>
        </a-button>
      </a-col>
      <a-col v-show="tlbxExpand.right" flex="3" class="border mb-6">
        <DsbProps v-if="!cmpProps.key" v-model:value="dsbProps" />
        <ExtraProps
          v-else
          :field="exProps"
          :compo="cmpMap[cmpProps.ctype]"
          :save="pjtAPI.middle.dashboard.compo.save"
        >
          <a-descriptions-item label="操作">
            <a-button class="w-full" danger @click="onRmvCmpClick">
              <template #icon><delete-outlined /></template>
              删除
            </a-button>
          </a-descriptions-item>
        </ExtraProps>
      </a-col>
    </a-row>
  </LytMiddle>
</template>

<script lang="ts">
import { computed, createVNode, defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import LytMiddle from '../layouts/LytMiddle.vue'
import {
  CaretLeftOutlined,
  CaretRightOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons-vue'
import { cmpAPI, pjtAPI } from '@/apis'
import CmpIns from '@/types/cmpIns'
import MidDsb from '@/types/midDsb'
import { useStore } from 'vuex'
import { Modal } from 'ant-design-vue'
import Compo from '@lib/types/compo'
import { cmpLblMap, CompoType } from '@/types'
import CompoCard from '../components/mid/CompoCard.vue'
import DsbProps from '../components/mid/DsbProps.vue'
import ExtraProps from '../components/form/ExtraProps.vue'
import Field from '@lib/types/field'
import { v4 as uuidv4 } from 'uuid'
import { pid } from 'process'
import { refresh } from './Auth'

export default defineComponent({
  name: 'MiddleDashboard',
  components: {
    LytMiddle,
    CompoCard,
    DsbProps,
    ExtraProps,

    DeleteOutlined,
    CaretLeftOutlined,
    CaretRightOutlined
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const dsbCtnr = ref()
    const pid = route.params.pid as string
    const mainHeight = ref('100%')
    const dsbProps = reactive(new MidDsb())
    const compos = reactive([] as Compo[])
    const cmpMap = ref({} as Record<string, Compo>)
    const dspCmps = reactive([] as Compo[])
    const tlbxExpand = reactive({
      left: false,
      right: true
    })
    const cmpProps = reactive(new CmpIns())
    const exProps = computed(() =>
      Field.copy({ key: cmpProps.key, ftype: cmpProps.ctype, extra: cmpProps.extra })
    )
    const dspAllCmps = ref(false)

    onMounted(refresh)

    function resize() {
      const midOperBox = document.getElementById('midOperBox')
      const opBoxBtm = midOperBox ? midOperBox.getBoundingClientRect().bottom : 0
      mainHeight.value = `calc(100vh - ${opBoxBtm + 16 + 40}px)`
    }
    async function refresh() {
      compos.splice(0, compos.length, ...(await cmpAPI.all()).map((cmp: any) => Compo.copy(cmp)))
      cmpMap.value = Object.fromEntries(compos.map(cmp => [cmp.name, cmp]))
      onDspCmpSwitch(dspAllCmps.value)

      await store.dispatch('project/refresh')

      MidDsb.copy(store.getters['project/ins'].middle.dashboard, dsbProps, true)
      resize()
    }
    async function onDropOnEmpty(e: DragEvent) {
      if (!e.dataTransfer) {
        return
      }
      const dragCompo = e.dataTransfer.getData('text/plain') as string
      const cmpIns = new CmpIns(cmpMap.value[dragCompo])
      await pjtAPI.middle.dashboard.compo.add(pid, cmpIns, refresh)
    }
    function onRmvCmpClick() {
      Modal.confirm({
        title: '是否移除组件',
        icon: createVNode(ExclamationCircleOutlined),
        okText: '确定',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          await pjtAPI.middle.dashboard.compo.remove(pid, cmpProps.key, async () => {
            cmpProps.reset()
            await refresh()
          })
        }
      })
    }
    function onDspCmpSwitch(display: boolean) {
      dspCmps.splice(
        0,
        dspCmps.length,
        ...compos.filter((cmp: Compo) =>
          !display ? cmp.category === 'display' || cmp.category === 'container' : true
        )
      )
    }
    function onCmpDragStart(e: DragEvent, cmpName: string) {
      cmpProps.reset()
      if (!e.dataTransfer) {
        return
      }
      e.dataTransfer.setData('text/plain', cmpName)
    }
    function onToolboxExpand(pos: 'left' | 'right') {
      tlbxExpand[pos] = !tlbxExpand[pos]
      resize()
    }
    function onCmpInsClick(cmpIns: CmpIns) {
      CmpIns.copy(cmpIns, cmpProps)
    }
    function onCmpInsDragEnter(cmpIns: CmpIns, e: DragEvent) {
      console.log(cmpIns, e)
    }
    function onCmpInsDragLeave(cmpIns: CmpIns) {
      console.log(cmpIns)
    }
    async function onDropInContainer(cmpIns: CmpIns, e: DragEvent) {
      if (!e.dataTransfer) {
        return
      }
      const cmpName = e.dataTransfer.getData('text/plain')
      await pjtAPI.middle.dashboard.compo.child.opera(
        pid,
        cmpIns.key,
        'children',
        new CmpIns(cmpMap.value[cmpName] as Compo, uuidv4()),
        'append',
        refresh
      )
    }
    return {
      CmpIns,
      Field,

      pid,
      pjtAPI,
      dsbCtnr,
      cmpLblMap,
      dsbProps,
      mainHeight,
      compos,
      cmpMap,
      dspCmps,
      tlbxExpand,
      cmpProps,
      exProps,
      dspAllCmps,

      resize,
      refresh,
      onDropOnEmpty,
      onRmvCmpClick,
      onDspCmpSwitch,
      onCmpDragStart,
      onToolboxExpand,
      onCmpInsClick,
      onCmpInsDragEnter,
      onCmpInsDragLeave,
      onDropInContainer
    }
  }
})
</script>
