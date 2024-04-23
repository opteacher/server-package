import jwt from 'jsonwebtoken'
import { db, makeRequest } from '../utils/index.js'
import { readConfig } from '../lib/backend-library/utils/index.js'
import { StringAdapter, newEnforcer } from 'casbin'
/*return deps.map(dep => `import ${dep.default ? dep.exports[0] : ('{ ' + dep.exports.join(', ') + ' }')} from '${dep.from}'`).join('\n')*/

export async function sign(ctx) {
  /*return `try {\n${nodes.join('\n\n')}\n  } catch (e) {\n    return { error: e.message || JSON.stringify(e) }\n  }\n`*/
}

export async function loadInst(mname, conds) {
  try {
    // 测试模式
    if (!conds) {
      // 如果不指定条件，这直接定义为生产模式
      throw new Error()
    }
    const Mdl = await import(`../models/${mname}.js`).then(exp => exp.default)
    return db.select(Mdl, conds).then(res => (conds._index ? res : res[0]))
  } catch (e) {
    // 生产模式
    return import(`../models/${mname}.json`).then(exp => exp.default)
  }
}

export async function db2StrPolicy(pjt) {
  const project = typeof pjt === 'string' ? await loadInst('project', { _index: pjt }) : pjt
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

let svrPkgURL = ''
if (typeof process.env.BASE_URL !== 'undefined') {
  svrPkgURL = `http://${process.env.BASE_URL}:4000/server-package`
} else if (process.env.NODE_ENV === 'test') {
  svrPkgURL = 'http://host.docker.internal:4000/server-package'
} else {
  svrPkgURL = 'http://server-package:4000/server-package'
}
console.log(svrPkgURL)

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
  const project = await loadInst('project', { name: pjtName })
  const authModel = await loadInst('model', { _index: project.auth.model })
  console.log('获取token解析出来的载荷')
  let rname = 'guest'
  const verRes = await verify(ctx)
  const payload = verRes.payload
  if (!verRes.error && payload) {
    console.log(payload)
    // 获取访问者角色信息（权限绑定模型之后，会给模型添加一个role字段，用于记录用户模型的角色ID，类型是字符串）
    const visitor = await db.select(
      await import(`../models/${authModel.name}.js`).then(exp => exp.default),
      { _index: payload.sub }
    )
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
  console.log(adapter)
  const enforcer = await newEnforcer('./configs/keymatch_model.conf', adapter)
  if (await enforcer.enforce(rname, ctx.path, ctx.method.toUpperCase())) {
    return {}
  } else {
    return { error: '你不具备访问该资源的权限！' }
  }
}

export async function auth(ctx, next) {
  const sectors = ctx.path.split('/').filter(sec => sec)
  if (!sectors.length) {
    return ctx.throw(403, '授权验证失败！错误的路由前缀（路由为空）')
  }
  const project = await loadInst('project', { name: sectors[0] })
  if (!project) {
    return ctx.throw(403, '授权验证失败！错误的路由前缀（未知项目名）')
  }
  const canSkip = ['/mdl/v1']
    .concat(project.skips || [])
    .map(skip => `/${sectors[0]}/${skip}` === ctx.path)
    .reduce((a, b) => a || b)
  if (!canSkip) {
    const result = await verifyDeep(ctx)
    if (!result || result.error) {
      return ctx.throw(
        403,
        `授权验证失败！${result && result.error ? result.error.message || JSON.stringify(result.error) : ''}`
      )
    }
  }
  await next()
}
