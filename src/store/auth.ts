/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { API, Auth, Model, Project, Property, Role, Rule } from '@/common'
import { makeRequest, reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import { BindModel } from '@/views/Auth'
import axios from 'axios'
import { Dispatch } from 'vuex'

type AuthState = {
  auth: Auth
  apis: API[]
}

export default {
  namespaced: true,
  state: {
    auth: new Auth(),
    apis: [] as API[]
  },
  mutations: {},
  actions: {
    async refresh({
      state,
      dispatch,
      rootGetters
    }: {
      state: AuthState
      dispatch: Dispatch
      rootGetters: any
    }) {
      await dispatch('project/refresh', undefined, { root: true })
      const project = rootGetters['project/ins']
      state.apis = (
        await makeRequest(axios.get(`/server-package/api/v1/project/${project.key}/apis`))
      ).result.map((api: any) => API.copy(api))
      if (project.auth) {
        Auth.copy(await reqGet('auth', project.auth.key), state.auth)
        for (const idx in state.auth.roles) {
          const role = state.auth.roles[idx]
          Role.copy(await reqGet('role', role.key), role)
        }
      }
    },
    async saveAPI({ state, dispatch }: { state: AuthState; dispatch: Dispatch }, api: API) {
      if (api.key) {
        await reqPut('api', api.key, api)
      } else {
        const newAPI = API.copy(await reqPost('api', api))
        await reqLink({
          parent: ['auth', state.auth.key],
          child: ['apis', newAPI.key]
        })
      }
      await dispatch('refresh')
    },
    async delAPI({ state, dispatch }: { state: AuthState; dispatch: Dispatch }, aid: string) {
      await reqLink(
        {
          parent: ['auth', state.auth.key],
          child: ['apis', aid]
        },
        false
      )
      await reqDelete('api', aid)
      await dispatch('refresh')
    },
    async saveRole({ state, dispatch }: { state: AuthState; dispatch: Dispatch }, role: Role) {
      if (role.key) {
        await reqPut('role', role.key, role, { ignores: ['rules'] })
      } else {
        const newRole = Role.copy(await reqPost('role', role, { ignores: ['rules'] }))
        await reqLink({
          parent: ['auth', state.auth.key],
          child: ['roles', newRole.key]
        })
      }
      await dispatch('refresh')
    },
    async delRole({ state, dispatch }: { state: AuthState; dispatch: Dispatch }, rid: string) {
      await reqLink(
        {
          parent: ['auth', state.auth.key],
          child: ['roles', rid]
        },
        false
      )
      await reqDelete('role', rid)
      await dispatch('refresh')
    },
    async saveRule(
      { dispatch }: { dispatch: Dispatch },
      { rule, roleId }: { rule: Rule; roleId: string }
    ) {
      if (rule.key) {
        await reqPut('rule', rule.key, rule)
      } else {
        const newRule = Rule.copy(await reqPost('rule', rule))
        await reqLink({
          parent: ['role', roleId],
          child: ['rules', newRule.key]
        })
      }
      await dispatch('refresh')
    },
    async delRule(
      { dispatch }: { dispatch: Dispatch },
      { ruleId, roleId }: { ruleId: string; roleId: string }
    ) {
      await reqLink(
        {
          parent: ['role', roleId],
          child: ['rules', ruleId]
        },
        false
      )
      await reqDelete('rule', ruleId)
      await dispatch('refresh')
    },
    async bindModel(
      { dispatch, rootGetters }: { dispatch: Dispatch; rootGetters: any },
      form: BindModel
    ) {
      const model = Model.copy(await reqGet('model', form.model))
      const auth = Auth.copy({
        idProps: form.idProps.map(
          idProp => model.props.find((prop: Property) => prop.key === idProp)?.name
        ),
        pwdProp: model.props.find((prop: Property) => prop.key === form.pwdProp)?.name
      })
      const project = rootGetters['project/ins'] as Project
      let aid = ''
      if (!project.auth || !project.auth.key) {
        aid = Auth.copy(await reqPost('auth', auth, { ignores: ['model', 'roles', 'apis'] })).key
      } else {
        aid = Auth.copy(
          await reqPut('auth', project.auth.key, auth, { ignores: ['model', 'roles', 'apis'] })
        ).key
      }
      await reqLink({
        parent: ['auth', aid],
        child: ['model', model.key]
      })
      await reqLink({
        parent: ['project', project.key],
        child: ['auth', aid]
      })
      await dispatch('refresh')
    }
  },
  getters: {
    ins: (state: AuthState): Auth => state.auth,
    apis: (state: AuthState): API[] => state.apis
  }
}
