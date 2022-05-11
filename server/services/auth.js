/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import Service from '../models/service.js'
import Dep from '../models/dep.js'
import { del as delNode, save as saveNode, scanNextss } from './node.js'

export async function bind(auth, mid) {
  return auth
}

export async function unbind(aid) {
}

export async function save(pid, auth) {
  await db.saveOne(Project, pid, { auth })
  return auth.model ? bind(auth) : auth
}

export async function del(pid) {
  return db.saveOne(Project, pid, { auth: null }, { updMode: 'delete' })
}

/**
 *
 * @param {*} pid
 * @param {*} { props } { props: { name: string; alg: string }[] }
 * @returns
 */
export async function genSignLgc(pid, { props }) {
  const project = await db.select(Project, { _index: pid }, { ext: true })
  if (!project.auth || !project.auth.model) {
    return { error: '项目未绑定模型！' }
  }
  // 更新比对字段
  await db.save(Auth, { props }, { _index: project.auth.key })
  const model = await db.select(Model, { _index: project.auth.model }, { ext: true })
  const svcTmp = model?.svcs.find(
    svc => svc.name === 'auth' && svc.path?.slice(-'sign'.length) === 'sign'
  )
  if (!svcTmp) {
    return { error: '未找到签名服务！' }
  }
  const service = await db.select(Service, { _index: svcTmp.key }, { ext: true })
  if (service.flow && service.flow.key) {
    const { allNodes } = await scanNextss(service.flow, '')
    for (const ndKey of Object.keys(allNodes)) {
      await delNode(ndKey)
    }
    await delNode(service.flow.key, service.key)
  }
  const getSecret = NdType.copy(
    await saveNode(
      {
        title: '获取密钥',
        code: [
          "const result = await makeRequest('GET', `${svrPkgURL}/api/v1/auth/secret`)",
          'if (result.error) {\n  return result\n}',
          'const secret = result.secret'
        ].join('\n'),
        outputs: [{ name: 'secret' }]
      },
      service.key
    )
  )
  const qryRecord = NdType.copy(
    await saveNode({
      title: '查询满足列的记录',
      code: [
        'const result = await db.select(model, {',
        props
          .map(
            prop =>
              `  '${prop.name}': ${
                prop.alg !== '不加密'
                  ? "crypto.createHmac('" + prop.alg + "', secret).update("
                  : ''
              }ctx.request.body.${prop.name}${prop.alg !== '不加密' ? ").digest('hex')" : ''}`
          )
          .join(',\n'),
        "})\nif(!result.length) {\n  return { error: '签名失败！提交表单错误' }\n}",
        'const record = result[0]'
      ].join('\n'),
      previous: getSecret.key,
      inputs: [{ name: 'model', value: model.name }],
      outputs: [{ name: 'record' }],
      deps: await Promise.all(
        [model.name, 'Crypto'].map((name) =>
          db.select(Dep, { name }).then(res => DepType.copy(res[0]))
        )
      )
    })
  )
  await saveNode({
    title: '包装荷载并签名',
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
    previous: qryRecord.key,
    isFun: false,
    deps: [DepType.copy((await db.select(Dep, { name: 'UUID' }))[0])]
  })
}
