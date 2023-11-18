<template>
  <a-popover
    v-model:visible="visibles.dkrRel"
    overlayClassName="popmu-p-0"
    trigger="click"
    placement="bottomLeft"
  >
    <template #content>
      <a-menu class="w-48 border-r-0" mode="inline" @click="onDkrRelClick">
        <a-menu-item key="deploy">
          <template #icon><DeploymentUnitOutlined /></template>
          部署
        </a-menu-item>
        <a-divider class="my-0" />
        <a-menu-item key="export">
          <template #icon><ExportOutlined /></template>
          导出镜像
        </a-menu-item>
        <a-menu-item key="info">
          <template #icon><InfoCircleOutlined /></template>
          信息
        </a-menu-item>
      </a-menu>
    </template>
    <a-button>
      <template #icon>
        <icon>
          <template #component>
            <svg
              t="1700206986814"
              class="icon"
              viewBox="0 0 1264 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="2912"
              width="1em"
              height="1em"
            >
              <path
                d="M866.219477 249.333255L941.043532 310.613133l24.319323 20.045382c20.466757 17.93851 38.044089 37.8635 51.949444 59.774969l4.574922 7.524543 16.253013 1.745694c24.981483 3.431192 49.361002 10.594556 72.11522 21.791076l11.557698 6.140028 6.922579 4.153547 86.682735 55.681618-50.083358 88.970196-3.370995 6.621598c-33.890541 61.942038-89.692552 96.976309-156.510493 109.196167l-7.464347 1.203927-4.514726 8.909058c-108.473811 204.787961-305.616836 315.489037-551.759685 320.846512L423.174388 1023.33784C266.242521 1023.33784 130.138588 957.061666 51.702752 829.204632l-16.674387-27.750514v-5.056493l-2.588443-5.176885a399.643525 399.643525 0 0 1-32.084651-169.151726C1.378609 583.001587 7.217655 540.201987 17.631622 493.610017h731.44577l-0.240785-4.815707c-1.203927-46.772559 10.654753-97.096702 36.71977-136.826289l7.40415-10.594557 73.25895-92.040209z m14.447122 133.455294l-13.303392 16.61419c-18.480277 24.379519-25.764035 64.470284-23.416377 94.749045 2.528246 24.078537 9.992593 47.856093 22.934807 66.456763-10.474164 5.538064-23.476574 10.654753-33.529364 16.072424a213.095056 213.095056 0 0 1-69.647169 10.714949H98.896686l-2.46805 15.831639-0.601964 7.343954c-3.732173 49.240609 4.454529 98.722003 23.897949 143.989653l10.112985 18.60067v2.588443l3.370996 5.538064c62.784786 102.333784 171.619775 148.32379 290.025983 148.32379 231.876315 0 421.976368-103.477515 512.210687-326.264182 59.052613 2.588443 118.707189-13.303392 146.698489-71.633648l7.464347-13.303392-12.400447-8.006114-4.27394-2.588443c-33.107989-18.721063-76.930927-20.948328-113.831286-10.714949l-0.782552 0.120393v-0.300982l-0.722357-5.056493c-6.862383-40.090765-31.663277-72.957968-63.86832-98.421022l-13.00241-10.654752zM150.063578 328.070072v109.376757H39.603287V328.070072H150.063578z m165.78073 0v109.376757H205.384017V328.070072h110.520487z m165.78073 0v109.376757H371.164748V328.070072h110.520486z m165.78073 0v109.376757H536.945478V328.070072h110.520486zM315.904504 164.035036v109.376756H205.384017V164.035036h110.520487z m165.78073 0v109.376756H371.164748V164.035036h110.520486z m165.78073 0v109.376756H536.945478V164.035036h110.520486zM481.685234 0v109.376756H371.164748V0h110.520486z"
                fill="#333333"
                p-id="2913"
              ></path>
            </svg>
          </template>
        </icon>
      </template>
      Docker
    </a-button>
  </a-popover>
  <a-modal v-model:visible="visibles.dkrInfo" title="Docker信息" :footer="null">
    <a-tabs>
      <a-tab-pane key="1" tab="运行指令" class="relative">
        <pre class="p-2 bg-slate-200">{{ runCmd }}</pre>
        <a-button class="absolute top-2 right-2" @click="copyRunCmd">
          <template #icon><CopyOutlined /></template>
        </a-button>
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>

<script setup lang="ts">
import { pjtAPI } from '@/apis'
import Icon, {
  CopyOutlined,
  DeploymentUnitOutlined,
  ExportOutlined,
  InfoCircleOutlined
} from '@ant-design/icons-vue'
import { Modal, message } from 'ant-design-vue'
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useStore } from 'vuex'

const visibles = reactive({
  dkrRel: false,
  dkrInfo: false
})
const store = useStore()
const route = useRoute()
const pid = route.params.pid as string
const runCmd = ref('')

onMounted(async () => {
  runCmd.value = await pjtAPI.docker.runCmd(pid).then((cmd: string) => {
    const fixCmd = cmd
      .replaceAll('--network', '\n\t--network')
      .replaceAll('--name', '\n\t--name')
      .replaceAll('-p', '\n\t-p')
      .replaceAll('-v', '\n\t-v')
    const lstBlkIdx = fixCmd.lastIndexOf(' ')
    const ret = fixCmd.slice(0, lstBlkIdx) + '\n  ' + fixCmd.substring(lstBlkIdx + 1)
    return ret.replaceAll('\t', '  ')
  })
})

function onDkrRelClick({ key }: { key: 'export' | 'info' }) {
  switch (key) {
    case 'export':
      onExportClick()
      break
    case 'info':
      visibles.dkrInfo = true
      break
  }
}
function onExportClick() {
  const project = store.getters['project/ins']
  Modal.confirm({
    title: '确定生成并导出Docker镜像吗？',
    onOk: () => pjtAPI.docker.expImg(pid, `${project.name}.tar`)
  })
}
function copyRunCmd() {
  navigator.clipboard.writeText(runCmd.value)
  message.success('复制成功！')
}
</script>
