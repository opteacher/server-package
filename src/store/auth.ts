/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { API, Auth, Project, Role, Rule } from '@/common'
import router from '@/router'
import { reqAll, reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'
import { CfgSgnType } from '@/views/Auth'
import { message, notification } from 'ant-design-vue'
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
      state.apis = (await reqAll(`project/${project.key}/api`, { type: 'api' })).map((api: any) =>
        API.copy(api)
      )
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
      auth: Auth
    ) {
      const project = rootGetters['project/ins'] as Project
      // 绑定模型（会为模型加上一个role字段并在role中创建一条guest记录）
      if (auth.key) {
        await reqPost(`/project/${project.key}/auth`, auth, {
          type: 'api',
          ignores: ['roles', 'apis']
        })
      } else {
        await reqPut('auth', auth.key, auth, { ignores: ['roles', 'apis'] })
      }
      await dispatch('refresh')
    },
    async unbindModel({ dispatch, rootGetters }: { dispatch: Dispatch; rootGetters: any }) {
      const project = rootGetters['project/ins'] as Project
      await reqDelete('project', `${project.key}/auth`, { type: 'api' })
      await dispatch('refresh')
      router.push(`/server-package/project/${project.key}`)
    },
    async regup({ dispatch }: { dispatch: Dispatch }, admin: any) {
      const result = await reqPost('log/regup', admin, { type: 'api' })
      if (result.error) {
        notification.error({
          message: '注册时发生错误！',
          description: result.error
        })
        return
      }
      message.success('注册成功！')
      await dispatch('login', admin)
    },
    async login(_module: any, admin: any) {
      const result = await reqPost('log/in', admin, { type: 'api' })
      console.log(result)
    },
    async genSmplSignLgc(
      { state, dispatch, rootGetters }: { state: AuthState; dispatch: Dispatch; rootGetters: any },
      props: CfgSgnType[]
    ) {
      const project = rootGetters['project/ins'] as Project
      const model = project.models.find(mdl => mdl.key === state.auth.model)
      const service = model?.svcs.find(
        svc => svc.name === 'auth' && svc.path?.slice(-'sign'.length) === 'sign'
      )
      await dispatch('service/delNode', service?.flow, { root: true })
      await dispatch(
        'service/saveNode',
        {
          title: '获取密钥',
          code: [
            "const svtPkgURL = 'http://server-package:4000/server-package'",
            "const result = await makeRequest('GET', `${svrPkgURL}/api/v1/auth/secret`)",
            'if (result.error) {\n  return result\n}',
            'const secret = result.secret'
          ].join('\n')
        },
        { root: true }
      )
      await dispatch(
        'service/saveNode',
        {
          title: '查询满足列的记录',
          code: [
            'const result = await db.select(model, {',
            props.map(
              prop =>
                `'${prop.name}': ${
                  prop.algorithm
                    ? "crypto.createHmac('" + prop.algorithm + "', secret).update("
                    : ''
                }ctx.request.body.${prop.name}${prop.algorithm ? ").digest('hex')" : ''},`
            ),
            "})\nif(!result.length) {\n  return { error: '签名失败！提交表单错误' }\n}",
            'const record = result[0]'
          ].join('\n')
        },
        { root: true }
      )
      await dispatch(
        'service/saveNode',
        {
          title: '包装荷载并签名',
          code: [
            'const payload = {',
            "  sub: 'action',",
            '  aud: record.id,',
            '  iat: Date.now(),',
            '  jti: uuidv4(),',
            "  iss: 'opteacher',",
            '  exp: Date.now() + (24 * 60 * 60 * 1000) // 1 day',
            '}\nreturn {',
            '  record,',
            '  token: jwt.sign(payload, secret),',
            "  message: '登录成功！'",
            '}'
          ].join('\n')
        },
        { root: true }
      )
    }
  },
  getters: {
    ins: (state: AuthState): Auth => state.auth,
    apis: (state: AuthState): API[] => state.apis
  }
}
