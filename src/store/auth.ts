/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExpClsForm, Model, Role } from '@/common'
import router from '@/router'
import { makeRequest, reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'

export default {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {
    async saveRole(_store: any, role: Role) {
      if (!router.currentRoute.value.params.pid) {
        return
      }
      const pid = router.currentRoute.value.params.pid
      if (role.key) {
        await reqPut('role', role.key, role, { ignores: ['auths'] })
      } else {
        const newRole = Role.copy(await reqPost('role', role, { ignores: ['auths'] }))
        await reqLink({
          parent: ['project', pid],
          child: ['roles', newRole.key]
        })
      }
    },
    async delRole(_store: any, rid: string) {
      await reqDelete('role', rid)
    }
  },
  getters: {}
}
