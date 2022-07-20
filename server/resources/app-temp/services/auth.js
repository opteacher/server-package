import jwt from 'jsonwebtoken'
import { db, makeRequest } from '../utils/index.js'
/*return deps.map(dep => `import ${dep.default ? dep.exports[0] : ('{ ' + dep.exports.join(', ') + ' }')} from '${dep.from}'`).join('\n')*/

const svrPkgURL = `http://${
  typeof process.env.BASE_URL !== 'undefined'
  ? process.env.BASE_URL
  : (process.env.NODE_ENV === 'test' ? 'host.docker.internal' : 'server-package')
}:4000/server-package`

export async function sign(ctx) {
  /*return `try {\n${nodes.join('\n\n')}\n  } catch (e) {\n    return { error: e.message || JSON.stringify(e) }\n  }\n`*/
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
  const project = await makeRequest('GET', `${svrPkgURL}/mdl/v1/project//*return project.id*/`)
  if (!project.auth || !project.auth.model) {
    return { error: '未配置权限系统' }
  }
  // 获取token解析出来的载荷
  let rname = 'guest'
  const verRes = await verify(ctx)
  const payload = verRes.payload
  if (!verRes.error && payload) {
    console.log(payload)
    // 获取访问者角色信息（权限绑定模型之后，会给模型添加一个role字段，用于记录用户模型的角色ID，类型是字符串）
    const visitor = await db.select(0/*return mdlName*/, { _index: payload.sub })
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
    // 如果角色为空，检查是否是server-package的超级管理员
    if (await makeRequest('GET', `${svrPkgURL}/mdl/v1/admin/${payload.sub}`)) {
      return {}
    } else {
      return { error: '未找到指定角色！' }
    }
  }
  // 遍历角色授权的规则，查找其中是否满足当前请求包含的申请
  const role = project.auth.roles.find(role => role.name === rname)
  if (!role) {
    return { error: '未找到指定角色！' }
  }
  for (const rule of role.rules) {
    if (rule.method !== 'ALL' && rule.method.toLowerCase() !== ctx.method.toLowerCase()) {
      continue
    }
    if (rule.action) {
      if (payload.sub.toLowerCase() !== rule.action.toLowerCase()) {
        continue
      }
    }
    const path = `/${project.name}${rule.path}`
    if (path === ctx.path) {
      return {}
    }
    if (ctx.path.startsWith(path)) {
      switch (rule.value) {
        case '/':
          if (ctx.path === path) {
            return {}
          }
          break
        case '*/*':
          return {}
        case '*':
          if (
            ctx.path
              .substring(path.length)
              .split('/')
              .filter(part => part).length === 1
          ) {
            return {}
          }
          break
      }
    }
  }
  return { error: '你不具备访问该资源的权限！' }
}

const skips = [
  /*return `\'/${project.name}/mdl/v1\'`*/,
  /*return skips.map(skip => `\'/${project.name}${skip}\'`).join(',\n  ')*/
]

const apis = [
  /*return apis.map(api => `{ method: \'${api.method}\', path: ${typeof api.path !== 'string' ? api.path : '\'' + api.path + '\''} }`).join(',\n  ')*/
]

export async function chkReqAva(ctx) {
  for (const api of apis) {
    if (api.method.toUpperCase() !== ctx.method.toUpperCase()) {
      continue
    }
    if (typeof api.path === 'string') {
      if (api.path === ctx.path) {
        return true
      }
    } else if (api.path.test(ctx.path)) {
      return true
    }
  }
  return false
}

export function auth() {
  return async (ctx, next) => {
    const canSkip = skips.map((skip) => skip === ctx.path).reduce((a, b) => a || b)
    if (!canSkip) {
      if (await chkReqAva(ctx)) {
        const result = await verifyDeep(ctx)
        if (!result || result.error) {
          ctx.throw(403, `授权验证失败！${result && result.error ? result.error.message : ''}`)
        }
      }
    }
    await next()
  }
}
