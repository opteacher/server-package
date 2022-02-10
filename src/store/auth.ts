/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { API, Auth, Model, Role } from '@/common'
import router from '@/router'
import { reqDelete, reqLink, reqPost, reqPut } from '@/utils'
import { BindModelMapper } from '@/views/Auth'
import { Dispatch } from 'vuex'

export default {
  namespaced: true,
  state: {},
  mutations: {},
  actions: {
    async refresh({ dispatch, rootGetters }: { dispatch: Dispatch, rootGetters: any }) {
      await dispatch('project/refresh', undefined, { root: true })
      BindModelMapper['model'].options = rootGetters['project/ins'].models.map((mdl: Model) => ({
        label: mdl.name, value: mdl.name
      }))
    },
    async saveAPI({ dispatch }: { dispatch: Dispatch }, api: API) {
      if (!router.currentRoute.value.params.pid) {
        return
      }
      const pid = router.currentRoute.value.params.pid
      if (api.key) {
        await reqPut('api', api.key, api)
      } else {
        const newAPI = API.copy(await reqPost('api', api))
        await reqLink({
          parent: ['project', pid],
          child: ['apis', newAPI.key]
        })
      }
      await dispatch('refresh')
    },
    async delAPI({ dispatch }: { dispatch: Dispatch }, aid: string) {
      if (!router.currentRoute.value.params.pid) {
        return
      }
      const pid = router.currentRoute.value.params.pid
      await reqLink(
        {
          parent: ['project', pid],
          child: ['apis', aid]
        },
        false
      )
      await reqDelete('api', aid)
      await dispatch('refresh', undefined)
    },
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
      await dispatch('refresh', undefined)
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
      await dispatch('refresh', undefined)
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
      await dispatch('refresh', undefined)
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
      await dispatch('refresh', undefined)
    }
  },
  getters: {}
}
