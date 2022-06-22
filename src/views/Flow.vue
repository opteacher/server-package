<template>
  <LytService :active="`project/${pid}/model/${mid}/flow/${sid}`">
    <div style="position: relative; width: 100%; height: 100%">
      <div class="flow-panel" ref="panelRef">
        <VarsPanel />
        <TmpNdPanel />
        <NodeCard v-if="Object.values(nodes).length === 0" @click:addBtn="onAddBtnClicked" />
        <template v-else>
          <NodeCard
            v-for="node in (Object.values(nodes) as NodeInPnl[])"
            :key="node.key"
            :nd-key="node.key"
            @click:card="() => store.commit('service/SET_NODE', { node })"
            @click:addBtn="onAddBtnClicked"
            @mouseenter="store.commit('service/UPDATE_LOCVARS', node)"
            @mouseleave="store.commit('service/UPDATE_LOCVARS')"
          />
        </template>
      </div>
    </div>
    <FormDialog
      :title="editTitle"
      width="70vw"
      :column="[2, 22]"
      :copy="Node.copy"
      :show="store.getters['service/nodeVsb']"
      :mapper="edtNdMapper"
      :object="store.getters['service/editNode']"
      :emitter="edtNdEmitter"
      @update:show="() => store.commit('service/SET_NODE_INVSB')"
      @submit="onNodeSaved"
      @initialize="store.dispatch('service/refreshTemps')"
    />
    <FormDialog
      title="选择组"
      width="35vw"
      :show="store.getters['service/joinVsb']"
      :mapper="joinMapper"
      :copy="
        (src: any, tgt: any) => {
          tgt = tgt || { group: '' }
          tgt.group = src.group || tgt.group
          return tgt
        }
      "
      @submit="
        ;async (edited: any) => {
          await api.joinLib(edited.group)
          edtNdEmitter.emit('refresh')
        }
      "
      @update:show="() => store.commit('service/SET_JOIN_VSB', false)"
      @initialize="
        ;async () => {
          await store.dispatch('service/refreshTemps')
          joinMapper['group'].options = store.getters['service/tempGrps']
        }
      "
    />
  </LytService>
</template>

<script lang="ts">
import { computed, defineComponent, onBeforeMount, onMounted, ref } from 'vue'
import LytService from '../layouts/LytService.vue'
import NodeCard from '../components/flow/NodeCard.vue'
import Node from '../types/node'
import FormDialog from '../components/com/FormDialog.vue'
import { edtNdEmitter, edtNdMapper, joinMapper } from './Flow'
import { useStore } from 'vuex'
import VarsPanel from '../components/flow/VarsPanel.vue'
import TmpNdPanel from '../components/flow/TmpNdPanel.vue'
import { useRoute } from 'vue-router'
import { ndAPI as api } from '../apis'
import NodeInPnl from '@/types/ndInPnl'

export default defineComponent({
  name: 'Flow',
  components: {
    LytService,
    NodeCard,
    FormDialog,
    VarsPanel,
    TmpNdPanel
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    const pid = route.params.pid
    const mid = route.params.mid
    const sid = route.params.sid
    const panelRef = ref()
    const node = computed(() => store.getters['service/editNode'])
    const editTitle = computed(() => {
      if (node.value.key) {
        if (node.value.isTemp) {
          return `编辑模板节点#${node.value.key}`
        } else {
          return `编辑节点#${node.value.key}`
        }
      } else if (node.value.previous && node.value.previous.key) {
        return `在节点#${node.value.previous.key}后新增节点`
      } else {
        return '在根节点后新增节点'
      }
    })
    const nodes = computed(() => store.getters['service/nodes'])
    const rszObs = new ResizeObserver(async () => {
      store.commit('service/SET_WIDTH', panelRef.value.clientWidth)
      await store.dispatch('service/refresh')
    })

    onBeforeMount(() => {
      store.commit('service/RESET_STATE')
    })
    onMounted(() => {
      rszObs.observe(panelRef.value)
    })

    function onAddBtnClicked(pvsKey: string) {
      node.value.reset()
      store.commit('service/SET_NODE', {
        node: pvsKey ? { previous: pvsKey } : undefined
      })
    }
    async function onNodeSaved(node: Node, next: () => void) {
      await api.save(node)
      next()
    }
    return {
      Node,
      NodeInPnl,

      pid,
      mid,
      sid,
      api,
      store,
      nodes,
      panelRef,
      editTitle,
      joinMapper,
      edtNdEmitter,
      edtNdMapper,

      onNodeSaved,
      onAddBtnClicked
    }
  }
})
</script>

<style lang="less">
.flow-panel {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  overflow-y: auto;
}
</style>
