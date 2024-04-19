/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import _ from 'lodash'
import jwt from 'jsonwebtoken'
import { db, makeRequest } from '../utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import Service from '../models/service.js'
import Dep from '../models/dep.js'
import Node from '../models/node.js'
import { rmv as rmvNode, save as saveNode, scanNextss } from './node.js'
import { readConfig } from '../lib/backend-library/utils/index.js'
import { StringAdapter, newEnforcer } from 'casbin'

export async function bind(pid, auth) {
  let project = await db.select(Project, { _index: pid }, { ext: true })
  const model = await db.select(Model, { _index: auth.model })
  // 查看欲绑定的模型下是否有role字段，没有则创建
  const roleIdx = model.props.findIndex(prop => prop.name === 'role')
  if (roleIdx === -1) {
    await db.saveOne(
      Model,
      auth.model,
      {
        props: {
          name: 'role',
          ptype: 'String',
          label: '角色',
          visible: true,
          remark: '权限系统标识'
        }
      },
      { updMode: 'append' }
    )
  }
  // 检查模型是否具有签发、验证接口，没有则添加
  const skips = project.auth.skips
  let svcIdx = project.services.findIndex(svc => svc.name === 'auth' && svc.interface === 'sign')
  if (svcIdx === -1) {
    const sgnSvc = await db.save(Service, {
      name: 'auth',
      interface: 'sign',
      emit: 'api',
      method: 'POST',
      path: `/api/v1/${model.name}/sign`,
      needRet: true
    })
    await db.saveOne(Project, pid, { services: sgnSvc.id }, { updMode: 'append' })
    skips.push(sgnSvc.path)
  }
  svcIdx = project.services.findIndex(svc => svc.name === 'auth' && svc.interface === 'verify')
  if (svcIdx === -1) {
    const vfySvc = await db.save(Service, {
      name: 'auth',
      interface: 'verify',
      emit: 'api',
      method: 'POST',
      path: `/api/v1/${model.name}/verify`,
      needRet: true
    })
    await db.saveOne(Project, pid, { services: vfySvc.id }, { updMode: 'append' })
    skips.push(vfySvc.path)
  }
  svcIdx = project.services.findIndex(svc => svc.name === 'auth' && svc.interface === 'verify')
  if (svcIdx === -1) {
    const vfySvc = await db.save(Service, {
      name: 'auth',
      interface: 'verifyDeep',
      emit: 'api',
      method: 'POST',
      path: `/api/v1/${model.name}/verify/deep`,
      needRet: true
    })
    await db.saveOne(Project, pid, { services: vfySvc.id }, { updMode: 'append' })
    skips.push(vfySvc.path)
  }
  // 跳过的路由附加到授权系统中
  auth.skips = (auth.skips || []).concat(Array.from(new Set(skips)))
  project = await db.saveOne(Project, pid, { auth }, { updMode: 'merge' })
  return project.auth
}

export async function unbind(pid) {
  const project = await db.select(Project, { _index: pid }, { ext: true })
  if (!project.auth.model) {
    return { error: '项目未绑定模型' }
  }
  // 收集模型权限相关的接口
  const model = await db.select(Model, { _index: project.auth.model }, { ext: true })
  const sgnSvc = project.services.find(svc => svc.name === 'auth' && svc.interface === 'sign')
  const sgnSid = sgnSvc ? sgnSvc.id : null
  if (sgnSid) {
    if (sgnSvc.flow) {
      const { allNodes } = await scanNextss(await db.select(Node, { _index: sgnSvc.flow }), '')
      for (const nid of Object.keys(allNodes)) {
        await rmvNode(nid)
      }
      await rmvNode(sgnSvc.flow, sgnSvc.id)
    }
    await db.remove(Service, { _index: sgnSid })
    await db.saveOne(Project, pid, { service: sgnSid }, { updMode: 'delete' })
  }
  let vfySvc = project.services.find(svc => svc.name === 'auth' && svc.interface === 'verify')
  let vfySid = vfySvc ? vfySvc.id : null
  if (vfySid) {
    await db.remove(Service, { _index: vfySid })
    await db.saveOne(Project, pid, { service: vfySid }, { updMode: 'delete' })
  }
  vfySvc = project.services.find(svc => svc.name === 'auth' && svc.interface === 'verifyDeep')
  vfySid = vfySvc ? vfySvc.id : null
  if (vfySid) {
    await db.remove(Service, { _index: vfySid })
    await db.saveOne(Project, pid, { service: vfySid }, { updMode: 'delete' })
  }
  // 清除模型role字段
  await db.saveOne(Model, project.auth.model, { 'props[{name:role}]': null }, { updMode: 'delete' })
  return db.saveOne(
    Project,
    pid,
    { auth: { model: '', skips: [], props: [] } },
    { updMode: 'merge' }
  )
}

/**
 *
 * @param {*} pid
 * @param {*} { props } { props: { name: string; alg: string }[] }
 * @returns
 */
export async function genSign(pid, props) {
  const project = await db.select(Project, { _index: pid }, { ext: true })
  if (!project.auth || !project.auth.model) {
    return { error: '项目未绑定模型！' }
  }
  // 更新比对字段
  await db.saveOne(Project, pid, { 'auth.props': props })
  const model = await db.select(Model, { _index: project.auth.model })
  const sgnSvc = project.services.find(svc => svc.name === 'auth' && svc.interface === 'sign')
  if (!sgnSvc) {
    return { error: '未找到签名服务！' }
  }
  // 清除之前签名的流程节点
  const service = await db.select(Service, { _index: sgnSvc.id }, { ext: true })
  if (service.flow && service.flow.id) {
    const { allNodes } = await scanNextss(service.flow, '')
    for (const nid of Object.keys(allNodes)) {
      await rmvNode(nid)
    }
    await rmvNode(service.flow.id, service.id)
  }
  const getSecret = await saveNode(
    {
      title: '获取密钥',
      desc: '获取密钥',
      ntype: 'normal',
      code: 'const secret = await getSecret()',
      outputs: [{ name: 'secret' }],
      isFun: false
    },
    service.id
  )
  const qryRecord = await saveNode({
    title: '查询满足列的记录',
    desc: '查询满足列的记录',
    ntype: 'normal',
    code: [
      'const result = await db.select(model, {',
      props
        .map(
          prop =>
            `  '${prop.name}': ${
              prop.alg !== 'none' ? "crypto.createHmac('" + prop.alg + "', secret).update(" : ''
            }ctx.request.body.${prop.name}${prop.alg !== 'none' ? ").digest('hex')" : ''}`
        )
        .join(',\n'),
      '})',
      "if(typeof result === 'string') {\n  return { error: result }\n}",
      "if(!result.length) {\n  return { error: '签名失败！提交表单错误' }\n}",
      'const record = result[0]'
    ].join('\n'),
    previous: getSecret.id,
    inputs: [{ name: 'model', value: _.capitalize(model.name) }],
    outputs: [{ name: 'record' }],
    deps: (
      await Promise.all([
        db.select(Dep, { name: 'Crypto' }).then(deps => (deps.length ? deps[0].id : null)),
        db.select(Dep, { index: model.id }).then(dep => (dep ? dep.id : null))
      ])
    ).filter(dep => dep),
    isFun: false
  })
  await saveNode({
    title: '包装荷载并签名',
    desc: '包装荷载并签名',
    ntype: 'normal',
    code: [
      'const payload = {',
      '  sub: record.id,',
      `  aud: '${project.name}',`,
      '  iat: Date.now(),',
      '  jti: v4(),',
      "  iss: 'server-package/op',",
      '  exp: Date.now() + 24 * 60 * 60 * 1000 // 1 day',
      '}\nreturn {',
      '  record,',
      '  token: jwt.sign(payload, secret),',
      "  message: '登录成功！'",
      '}'
    ].join('\n'),
    previous: qryRecord.id,
    isFun: false,
    deps: (
      await Promise.all([
        db.select(Dep, { name: 'UUID' }).then(deps => (deps.length ? deps[0].id : null))
      ])
    ).filter(dep => dep)
  })
}

export async function db2StrPolicy(pjt) {
  const project = typeof pjt === 'string' ? await db.select(Project, { _index: pid }) : pjt
  const valMap = {
    '/': '',
    s: '/s$',
    ':i': '/[^/]+$',
    '*': '/[^/]+$',
    '*/*': '/*'
  }
  const policies = []
  for (const role of project.auth.roles) {
    for (const rule of role.rules) {
      policies.push(
        [
          'p',
          role.name,
          [
            '/' + project.name,
            rule.path,
            valMap[rule.value],
            rule.action ? '/' + rule.action : ''
          ].join(''),
          rule.method === 'ALL' ? '(GET)|(POST)|(PUT)|(DELETE)' : rule.method
        ].join(',')
      )
    }
  }
  return policies
}

export async function getSecret() {
  try {
    return process.env['server_secret'] || readConfig('configs/server').secret
  } catch (e) {
    const result = await makeRequest('GET', `${svrPkgURL}/api/v1/server/secret`)
    if (result.error) {
      return result
    }
    return result.secret
  }
}

export async function verify(ctx) {
  if (!ctx.headers) {
    return { error: '无鉴权口令' }
  }
  const token = ctx.headers['authorization']
  if (!token) {
    return { error: '无鉴权口令' }
  }
  const tokens = token.split(' ')
  if (tokens.length !== 2) {
    return { error: '错误的鉴权请求！' }
  }
  try {
    let payload = null
    switch (tokens[0].toLowerCase()) {
      case 'bearer':
        {
          payload = jwt.verify(tokens[1], await getSecret())
        }
        break
      default:
        throw new Error(`未知鉴权方式：${tokens[0]}`)
    }
    return {
      payload,
      message: '验证通过！'
    }
  } catch (e) {
    return { error: `鉴权失败！${e.message || JSON.stringify(e)}` }
  }
}

export async function verifyDeep(ctx) {
  const pjtName = ctx.path.split('/').filter(p => p)[0]
  const result = await db.select(Project, { name: pjtName })
  if (result.length !== 1) {
    return { error: '错误的路由前缀（未知项目名）！' }
  }
  const project = result[0]
  if (!project.auth || !project.auth.model) {
    return { error: '未配置权限系统' }
  }
  const authModel = await db.select(Model, { _index: project.auth.model })
  console.log('获取token解析出来的载荷')
  let rname = 'guest'
  const verRes = await verify(ctx)
  const payload = verRes.payload
  if (!verRes.error && payload) {
    console.log(payload)
    // 获取访问者角色信息（权限绑定模型之后，会给模型添加一个role字段，用于记录用户模型的角色ID，类型是字符串）
    const visitor = await db.select(await import(`../models/${authModel.name}`), {
      _index: payload.sub
    })
    if (visitor && 'role' in visitor) {
      rname = visitor['role']
    } else {
      rname = ''
    }
  } else {
    // @_@：让guest角色起效
    // return verRes
  }
  console.log(rname)
  if (!rname) {
    if (project.independ) {
      return { error: '未找到指定角色！' }
    }
    console.log('如果角色为空，检查是否是server-package的超级管理员')
    try {
      if (await makeRequest('GET', `${svrPkgURL}/mdl/v1/admin/${payload.sub}`)) {
        return {}
      } else {
        return { error: '未找到指定角色！' }
      }
    } catch (e) {
      return { error: '访问server-package失败！' + e.message || JSON.stringify(e) }
    }
  }
  console.log('调用Casbin进行鉴权')
  const adapter = new StringAdapter(
    await db2StrPolicy(project).then(policies => policies.join('\n'))
  )
  const enforcer = await newEnforcer('../configs/keymatch_model.conf', adapter)
  if (await enforcer.enforce(rname, ctx.path, ctx.method.toUpperCase())) {
    return {}
  } else {
    return { error: '你不具备访问该资源的权限！' }
  }
}
