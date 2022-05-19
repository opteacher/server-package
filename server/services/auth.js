/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import Service from '../models/service.js'
import Dep from '../models/dep.js'
import Node from '../models/node.js'
import { del as delNode, save as saveNode, scanNextss } from './node.js'

export async function bind(pid, auth) {
  let project = await db.select(Project, { _index: pid })
  const model = await db.select(Model, { _index: auth.model }, { ext: true })
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
  let svcIdx = model.svcs.findIndex(svc => svc.name === 'auth' && svc.interface === 'sign')
  if (svcIdx === -1) {
    const sgnSvc = await db.save(Service, {
      name: 'auth',
      interface: 'sign',
      emit: 'api',
      method: 'POST',
      path: `/api/v1/${model.name}/sign`
    })
    await db.saveOne(Model, auth.model, { svcs: sgnSvc.id }, { updMode: 'append' })
    skips.push(sgnSvc.path)
  }
  svcIdx = model.svcs.findIndex(svc => svc.name === 'auth' && svc.interface === 'verify')
  if (svcIdx === -1) {
    const vfySvc = await db.save(Service, {
      name: 'auth',
      interface: 'verify',
      emit: 'api',
      method: 'POST',
      path: `/api/v1/${model.name}/verify`
    })
    await db.saveOne(Model, auth.model, { svcs: vfySvc.id }, { updMode: 'append' })
    skips.push(vfySvc.path)
  }
  // 跳过的路由附加到授权系统中
  auth.skips = (auth.skips || []).concat(Array.from(new Set(skips)))
  project = await db.saveOne(Project, pid, { auth }, { updMode: 'merge' })
  return project.auth
}

export async function unbind(pid) {
  const project = await db.select(Project, { _index: pid })
  if (!project.auth.model) {
    return { error: '项目未绑定模型' }
  }
  // 收集模型权限相关的接口
  const model = await db.select(Model, { _index: project.auth.model }, { ext: true })
  const sgnSvc = model.svcs.find(svc => svc.name === 'auth' && svc.interface === 'sign')
  const sgnSid = sgnSvc ? sgnSvc.id : null
  if (sgnSid) {
    if (sgnSvc.flow) {
      const { allNodes } = await scanNextss(await db.select(Node, { _index: sgnSvc.flow }), '')
      for (const nid of Object.keys(allNodes)) {
        await delNode(nid)
      }
      await delNode(sgnSvc.flow, sgnSvc.id)
    }
    await db.remove(Service, { _index: sgnSid })
    await db.saveOne(Model, project.auth.model, { svcs: sgnSid }, { updMode: 'delete' })
  }
  const vfySvc = model.svcs.find(svc => svc.name === 'auth' && svc.interface === 'verify')
  const vfySid = vfySvc ? vfySvc.id : null
  if (vfySid) {
    await db.remove(Service, { _index: vfySid })
    await db.saveOne(Model, project.auth.model, { svcs: vfySid }, { updMode: 'delete' })
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
  const project = await db.select(Project, { _index: pid })
  if (!project.auth || !project.auth.model) {
    return { error: '项目未绑定模型！' }
  }
  // 更新比对字段
  await db.saveOne(Project, pid, { 'auth.props': props })
  const model = await db.select(Model, { _index: project.auth.model }, { ext: true })
  const sgnSvc = model.svcs.find(svc => svc.name === 'auth' && svc.interface === 'sign')
  if (!sgnSvc) {
    return { error: '未找到签名服务！' }
  }
  // 清除之前签名的流程节点
  const service = await db.select(Service, { _index: sgnSvc.id }, { ext: true })
  if (service.flow && service.flow.id) {
    const { allNodes } = await scanNextss(service.flow, '')
    for (const nid of Object.keys(allNodes)) {
      await delNode(nid)
    }
    await delNode(service.flow.id, service.id)
  }
  const getSecret = await saveNode(
    {
      title: '获取密钥',
      ntype: 'normal',
      code: [
        "let result = await makeRequest('GET', `${svrPkgURL}/api/v1/server/secret`)",
        'if (result.error) {\n  return result\n}',
        'const secret = result.secret'
      ].join('\n'),
      outputs: [{ name: 'secret' }],
      isFun: false
    },
    service.id
  )
  const qryRecord = await saveNode({
    title: '查询满足列的记录',
    ntype: 'normal',
    code: [
      'result = await db.select(model, {',
      props
        .map(
          prop =>
            `  '${prop.name}': ${
              prop.alg !== 'none' ? "crypto.createHmac('" + prop.alg + "', secret).update(" : ''
            }ctx.request.body.${prop.name}${prop.alg !== 'none' ? ").digest('hex')" : ''}`
        )
        .join(',\n'),
      "})\nif(!result.length) {\n  return { error: '签名失败！提交表单错误' }\n}",
      'const record = result[0]'
    ].join('\n'),
    previous: getSecret.id,
    inputs: [{ name: 'model', value: model.name }],
    outputs: [{ name: 'record' }],
    deps: await Promise.all(
      [model.name, 'Crypto'].map(name =>
        db.select(Dep, { name }).then(dep => (dep.length ? dep[0].id : null))
      )
    ),
    isFun: false
  })
  const depUuid = (await db.select(Dep, { name: 'UUID' }))[0]
  await saveNode({
    title: '包装荷载并签名',
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
    deps: [depUuid.id]
  })
}
