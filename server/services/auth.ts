/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Project from '../models/project.js'
import PjtType from '../types/project.js'
import Model from '../models/model.js'
import MdlType from '../types/model.js'
import Property from '../models/property.js'
import RoleType from '../types/role.js'
import Role from '../models/role.js'
import RuleType from '../types/rule.js'
import Rule from '../models/rule.js'
import Auth from '../models/auth.js'
import AuthType from '../types/auth.js'
import API from '../models/api.js'
import Service from '../models/service.js'
import SvcType from '../types/service.js'
import NdType from '../types/node.js'
import VarType from '../types/variable.js'
import Dep from '../models/dep.js'
import DepType from '../types/dep.js'
import { del as delNode, save as saveNode, scanNextss } from './node.js'

export async function bind(auth: AuthType) {
  let ret = auth.roles.find(role => role.name === 'role')
  if (ret) {
    return ret
  }
  // 为绑定模型添加一列角色列，并添加一个访客记录
  const roleProp = await db.save(Property, {
    name: 'role',
    label: '角色',
    type: 'String',
    visible: false
  })
  const model = await db.save(
    Model,
    { props: roleProp.id },
    { _index: auth.model },
    { updMode: 'append' }
  )
  const guest = RoleType.copy(await db.save(Role, { name: 'guest' }))
  const allRule = RuleType.copy(await db.save(Rule, { method: '*', path: '/', value: '*/*' }))
  ret = await db.save(Role, { rules: allRule.key }, { updMode: 'append' })
  await db.save(Auth, { roles: guest.key }, { _index: auth.key }, { updMode: 'append' })
  // 为模型添加两个网络接口，一个用于签发、一个用于校验
  const signSvc = SvcType.copy(
    await db.save(Service, {
      name: 'auth',
      model: model.name,
      interface: 'sign',
      emit: 'api',
      method: 'POST',
      path: `/api/v1/${model.name}/sign`
    })
  )
  await db.save(Model, { svcs: signSvc.key }, { _index: auth.model }, { updMode: 'append' })
  const verifySvc = SvcType.copy(
    await db.save(Service, {
      name: 'auth',
      model: model.name,
      interface: 'verify',
      emit: 'api',
      method: 'POST',
      path: `/api/v1/${model.name}/verify`
    })
  )
  await db.save(Model, { svcs: verifySvc.key }, { _index: auth.model }, { updMode: 'append' })
  return ret
}

export async function save(pid: string, auth: any) {
  const project = PjtType.copy(await db.select(Project, { _index: pid }))
  delete auth.roles
  delete auth.apis
  const idxCond = project.auth && project.auth.key ? { _index: project.auth.key } : undefined
  auth = AuthType.copy(await db.save(Auth, auth, idxCond))
  await db.save(Project, { auth: auth.key }, { _index: project.key }, { updMode: 'append' })
  if (auth.model) {
    await bind(auth)
  }
  return auth
}

export async function del(pid: string) {
  const project = await db.select(Project, { _index: pid })
  const auth = AuthType.copy(await db.select(Auth, { _index: project.auth }, { ext: true }))
  await Promise.all(auth.apis.map(api => db.del(API, { _index: api.key })))
  for (const role of auth.roles) {
    await Promise.all(role.rules.map(rule => db.del(Rule, { _index: rule })))
    await db.del(Role, { _index: role.key })
  }
  await db.del(Auth, { _index: project.auth })
  return db.save(Project, { auth: project.auth }, { _index: pid }, { updMode: 'delete' })
}

export async function genSignLgc(
  pid: string,
  { props }: { props: { name: string; algorithm: string }[] }
) {
  const project = PjtType.copy(await db.select(Project, { _index: pid }, { ext: true }))
  if (!project.auth || !project.auth.model) {
    return { error: '项目未绑定模型！' }
  }
  const model = MdlType.copy(await db.select(Model, { _index: project.auth.model }, { ext: true }))
  const svcTmp = model?.svcs.find(
    svc => svc.name === 'auth' && svc.path?.slice(-'sign'.length) === 'sign'
  )
  if (!svcTmp) {
    return { error: '未找到签名服务！' }
  }
  const service = SvcType.copy(await db.select(Service, { _index: svcTmp.key }, { ext: true }))
  if (service.flow && service.flow.key) {
    const { allNodes } = await scanNextss(service.flow, '')
    for (const ndKey of Object.keys(allNodes)) {
      await delNode(ndKey)
    }
    await delNode(service.flow.key, service.key)
  }
  const getSecret = NdType.copy(
    await saveNode(
      NdType.copy({
        title: '获取密钥',
        code: [
          "const result = await makeRequest('GET', `${svrPkgURL}/api/v1/auth/secret`)",
          'if (result.error) {\n  return result\n}',
          'const secret = result.secret'
        ].join('\n'),
        outputs: [VarType.copy({ name: 'secret' })]
      }),
      service.key
    )
  )
  const qryRecord = NdType.copy(
    await saveNode(
      NdType.copy({
        title: '查询满足列的记录',
        code: [
          'const result = await db.select(model, {',
          props.map(
            prop =>
              `  '${prop.name}': ${
                prop.algorithm !== '不加密'
                  ? "crypto.createHmac('" + prop.algorithm + "', secret).update("
                  : ''
              }ctx.request.body.${prop.name}${
                prop.algorithm !== '不加密' ? ").digest('hex')" : ''
              },`
          ),
          "})\nif(!result.length) {\n  return { error: '签名失败！提交表单错误' }\n}",
          'const record = result[0]'
        ].join('\n'),
        previous: getSecret.key,
        inputs: [VarType.copy({ name: 'model', value: model.name })],
        outputs: [VarType.copy({ name: 'record' })],
        deps: [DepType.copy((await db.select(Dep, { name: model.name }))[0])]
      })
    )
  )
  await saveNode(
    NdType.copy({
      title: '包装荷载并签名',
      code: [
        'const payload = {',
        "  sub: 'action',",
        '  aud: record.id,',
        '  iat: Date.now(),',
        '  jti: v4(),',
        "  iss: 'opteacher',",
        '  exp: Date.now() + (24 * 60 * 60 * 1000) // 1 day',
        '}\nreturn {',
        '  record,',
        '  token: jwt.sign(payload, secret),',
        "  message: '登录成功！'",
        '}'
      ].join('\n'),
      previous: qryRecord.key,
      isFun: false,
      deps: [DepType.copy((await db.select(Dep, { name: 'UUID' }))[0])]
    })
  )
}
