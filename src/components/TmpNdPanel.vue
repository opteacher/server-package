<template>
<div v-if="hasTmpNds" :style="{
  position: 'fixed',
  width: '5vw',
  bottom: '150px',
  right: '100px',
  'z-index': 1000,
}">
  <a-button type="primary" ghost
    @click="$store.commit('route/SET_TEMP_VSB', true)"
  >
    <GoldOutlined />&nbsp;节点库
  </a-button>
  <a-modal
    title="节点库" :footer="null"
    :visible="$store.getters['route/tempVsb']"
    @cancel="$store.commit('route/SET_TEMP_VSB')"
  >
    <a-collapse v-model:activeKey="actNdGrp" accordion>
      <a-collapse-panel
        v-for="[group, tmpNds] of Object.entries(tmpNdsByGp)"
        :key="group"
        :header="group"
        class="collapse-ptb-0"
      >
        <a-list :bordered="false" :data-source="tmpNds">
          <template #renderItem="{ item: node }">
            <a-list-item>
              <a-list-item-meta :description="node.desc">
                <template #title>
                  <a href="#" @click="() => {
                    $store.commit('route/SET_NODE', {
                      node, viewOnly: true
                    })
                  }">
                    {{ node.title }}
                  </a>
                </template>
              </a-list-item-meta>
              <template #actions>
                <a-button @click="$store.commit('route/SET_NODE', { node })">
                  <EditOutlined />
                </a-button>
              </template>
            </a-list-item>
          </template>
        </a-list>
      </a-collapse-panel>
    </a-collapse>
  </a-modal>
</div>
</template>

<script lang="ts">
import { defineComponent, onMounted, reactive, ref, watch } from 'vue'
import { GoldOutlined, EditOutlined } from '@ant-design/icons-vue'
import { useStore } from 'vuex'
import { Node } from '../common'

export default defineComponent({
  name: 'TempNodePanel',
  components: {
    GoldOutlined,
    EditOutlined
  },
  setup () {
    const store = useStore()
    const actNdGrp = ref('')
    const hasTmpNds = ref(false)
    const tmpNdsByGp = reactive({} as { [group: string]: Node[] })

    onMounted(rfshGroup)
    watch(() => store.getters['route/tempVsb'], (show: boolean) => {
      if (show) {
        rfshGroup()
      }
    })

    async function rfshGroup () {
      await store.dispatch('route/rfshTemps')
      const tempNodes = store.getters['route/tempNodes']
      const allNdTmps = Object.values(tempNodes)
      for (const prop in tmpNdsByGp) {
        delete tmpNdsByGp[prop]
      }
      for (const ndTemp of allNdTmps) {
        const tempNode = Node.copy(ndTemp)
        if (tempNode.group in tmpNdsByGp) {
          tmpNdsByGp[tempNode.group].push(tempNode)
        } else {
          tmpNdsByGp[tempNode.group] = [tempNode]
        }
      }
      hasTmpNds.value = allNdTmps.length !== 0
      if (hasTmpNds.value) {
        actNdGrp.value = (allNdTmps[0] as Node).group
      }
    }
    return {
      actNdGrp,
      hasTmpNds,
      tmpNdsByGp,
    }
  }
})
</script>

<style lang="less">
.collapse-ptb-0 {
  .ant-collapse-content-box {
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }
}
</style>
