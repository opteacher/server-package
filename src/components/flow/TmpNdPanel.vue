<template>
  <div
    v-if="hasTmpNds"
    :style="{
      position: 'fixed',
      top: '150px',
      left: '100px',
      'z-index': 1000
    }"
  >
    <a-button type="primary" @click="store.commit('service/SET_TEMP_VSB', true)">
      <GoldOutlined />
      &nbsp;节点库
    </a-button>
    <a-modal title="节点库" :footer="null" v-model:visible="tmpVisible">
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
                    <a
                      href="#"
                      @click="
                        () => {
                          store.commit('service/SET_NODE', {
                            node,
                            viewOnly: true
                          })
                        }
                      "
                    >
                      {{ node.title }}
                    </a>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-button @click="store.commit('service/SET_NODE', { node })">
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
import Node from '@/types/node'

export default defineComponent({
  name: 'TempNodePanel',
  components: {
    GoldOutlined,
    EditOutlined
  },
  setup() {
    const store = useStore()
    const actNdGrp = ref('')
    const hasTmpNds = ref(false)
    const tmpVisible = ref(false)
    const tmpNdsByGp = reactive({} as { [group: string]: Node[] })

    onMounted(rfshGroup)
    watch(
      () => store.getters['service/tempNodes'],
      () => rfshGroup(false)
    )

    async function rfshGroup(force = true) {
      if (force) {
        await store.dispatch('service/refreshTemps')
      }
      const tempNodes = store.getters['service/tempNodes']
      for (const prop in tmpNdsByGp) {
        delete tmpNdsByGp[prop]
      }
      for (const ndTemp of tempNodes) {
        const tempNode = Node.copy(ndTemp)
        if (tempNode.group in tmpNdsByGp) {
          tmpNdsByGp[tempNode.group].push(tempNode)
        } else {
          tmpNdsByGp[tempNode.group] = [tempNode]
        }
      }
      hasTmpNds.value = tempNodes.length !== 0
      if (hasTmpNds.value) {
        actNdGrp.value = (tempNodes[0] as Node).group
      }
    }
    return {
      store,
      actNdGrp,
      hasTmpNds,
      tmpVisible,
      tmpNdsByGp
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
