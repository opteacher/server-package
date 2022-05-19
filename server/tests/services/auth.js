import jwt from 'jsonwebtoken'
import { db, makeRequest } from '../../utils/index.js'
import model1 from '../models/model1.js'
import crypto from 'crypto'
import { v4 } from 'uuid'

const svrPkgURL = `http://${
  typeof process.env.BASE_URL !== 'undefined'
  ? process.env.BASE_URL
  : (process.env.NODE_ENV === 'prod' ? 'server-package' : '127.0.0.1')
}:4000/server-package`

export async function sign(ctx) {
  try {
    /** 获取密钥
     * @returns {undefined} undefined
    **/
    let result = await makeRequest('GET', `${svrPkgURL}/api/v1/server/secret`)
    if (result.error) {
      return result
    }
    const secret = result.secret

    /** 查询满足列的记录
     * @param {undefined} model undefined
     * @returns {undefined} undefined
    **/
    result = await db.select(model1, {
      'username': ctx.request.body.username,
      'password': crypto.createHmac('sha256', secret).update(ctx.request.body.password).digest('hex')
    })
    if(!result.length) {
      return { error: '签名失败！提交表单错误' }
    }
    const record = result[0]

    // 包装荷载并签名
    const payload = {
      sub: record.id,
      aud: 'abcd',
      iat: Date.now(),
      jti: v4(),
      iss: 'server-package/op',
      exp: Date.now() + 24 * 60 * 60 * 1000 // 1 day
    }
    return {
      record,
      token: jwt.sign(payload, secret),
      message: '登录成功！'
    }
  } catch (e) {
    return { error: e.message || JSON.stringify(e) }
  }

}

export async function verify(ctx) {
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
      case 'bearer': {
        const result = await makeRequest('GET', `${svrPkgURL}/api/v1/server/secret`)
        if (result.error) {
          return result
        }
        payload = jwt.verify(tokens[1], result.secret)
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
  // 获取项目绑定的用户模型
  const path = ctx.path.startsWith('/') ? ctx.path.substring(1) : ctx.path
  const pjtName = path.substring(0, path.indexOf('/'))
  let result = await makeRequest('GET', `${svrPkgURL}/mdl/v1/projects?name=${pjtName}`)
  if (!result.length) {
    return { error: '未找到指定项目！' }
  }
  const project = result[0]
  if (!project.auth) {
    return { error: '未配置权限系统' }
  }
  const auth = project.auth
  if (!auth.model) {
    // return { error: '项目未绑定模型！' }
    return {}
  }
  // 获取token解析出来的载荷
  let role = auth.roles.find(role => role.name === 'guest')
  if (!role) {
    return { error: '项目权限系统未配置访客角色！' }
  }
  let roleId = role.id
  const verRes = await verify(ctx)
  console.log(verRes)
  const payload = verRes.payload
  if (!verRes.error && payload) {
    console.log(payload)
    // 获取访问者角色信息（权限绑定模型之后，会给模型添加一个role字段，用于记录用户模型的角色ID，类型是字符串）
    const visitor = await db.select(model1, { _index: payload.sub })
    if (!visitor || !('role' in visitor)) {
      return { error: '访问者的角色信息有误！' }
    }
    roleId = visitor['role']
  }
  console.log(roleId)
  // 获取对应的角色
  role = await makeRequest('GET', `${svrPkgURL}/mdl/v1/role/${roleId}`)
  if (!role) {
    // 检查是否是server-package的超级管理员
    if (await makeRequest('GET', `${svrPkgURL}/mdl/v1/admin/${roleId}`)) {
      return {}
    } else {
      return { error: '未找到指定角色！' }
    }
  }
  // 遍历角色授权的规则，查找其中是否满足当前请求包含的申请
  for (const rule of role.rules) {
    if (rule.method !== '*' && rule.method.toLowerCase() !== ctx.method.toLowerCase()) {
      continue
    }
    if (payload && payload.sub) {
      if (payload.sub.toLowerCase() !== rule.action.toLowerCase()) {
        continue
      }
    }
    if (rule.path === ctx.path) {
      return {}
    }
    if (ctx.path.startsWith(rule.path)) {
      switch (rule.value) {
        case '*/*':
          return {}
        case '*':
          if (
            ctx.path
              .substring(rule.path.length)
              .split('/')
              .filter(part => part).length === 1
          ) {
            return {}
          }
      }
    }
  }
  return { error: '你不具备访问该资源的权限！' }
}

const skips = [
  /\/abcd\/mdl\/v1/,
  /\/abcd\/test/,
  /\/abcd\/api\/v1\/model1\/sign/,
  /\/abcd\/api\/v1\/model1\/verify/
]

export function auth() {
  return async (ctx, next) => {
    const canSkip = skips.map((skip) => skip.test(ctx.path)).reduce((a, b) => a || b)
    if (!canSkip) {
      const result = await verifyDeep(ctx)
      if (result && result.error) {
        ctx.throw(403, `授权验证失败！${result.error}`)
      }
    }
    await next()
  }
}
