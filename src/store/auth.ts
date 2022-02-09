/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Auth, Role } from '@/common'
import router from '@/router'
import { reqDelete, reqLink, reqPost, reqPut } from '@/utils'
import { Dispatch } from 'vuex'

export default {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {
    async saveRole({ dispatch }: { dispatch: Dispatch }, role: Role) {
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
      await dispatch('project/refresh', undefined, { root: true })
    },
    async delRole({ dispatch }: { dispatch: Dispatch }, rid: string) {
      if (!router.currentRoute.value.params.pid) {
        return
      }
      const pid = router.currentRoute.value.params.pid
      await reqLink(
        {
          parent: ['project', pid],
          child: ['roles', rid]
        },
        false
      )
      await reqDelete('role', rid)
      await dispatch('project/refresh', undefined, { root: true })
    },
    async saveAuth(
      { dispatch }: { dispatch: Dispatch },
      { auth, rid }: { auth: Auth; rid: string }
    ) {
      if (auth.key) {
        await reqPut('authorization', auth.key, auth)
      } else {
        const newAuth = Auth.copy(await reqPost('authorization', auth))
        await reqLink({
          parent: ['role', rid],
          child: ['auths', newAuth.key]
        })
      }
      await dispatch('project/refresh', undefined, { root: true })
    },
    async delAuth(
      { dispatch }: { dispatch: Dispatch },
      { aid, rid }: { aid: string; rid: string }
    ) {
      await reqLink(
        {
          parent: ['role', rid],
          child: ['auths', aid]
        },
        false
      )
      await reqDelete('authorization', aid)
      await dispatch('project/refresh', undefined, { root: true })
    }
  },
  getters: {}
}
