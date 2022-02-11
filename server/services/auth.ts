import Path from 'path'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../utils/index.js'
import Admin from '../models/admin.js'
import { readConfig } from '../lib/backend-library/utils/index.js'

const config = readConfig(Path.resolve('configs', 'server'), false)

export async function login(reqBody: { name: string; password: string }) {
  const result = await db.select(Admin, {
    name: reqBody.name
  })
  if (!result.length) {
    return { error: '用户名不存在' }
  }
  const admin = result[0]

  if (
    admin.password !==
    crypto.createHmac('sha256', config.secret).update(reqBody.password).digest('hex')
  ) {
    return { error: '错误的登录密码' }
  }

  const payload = {
    sub: 'login',
    aud: admin.id,
    iat: Date.now(),
    jti: uuidv4(),
    iss: admin.name,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 1 day
  }
  delete admin.password
  return {
    admin,
    token: jwt.sign(payload, config.secret),
    message: '登录成功！'
  }
}

export async function verify(auth: any) {
  const auths = auth.split(' ')
  if (auths.length !== 2) {
    return { error: '错误的鉴权请求！' }
  }
  try {
    switch (auths[0].toLowerCase()) {
      case 'Bearer':
        jwt.verify(auths[1], config.secret)
        break
      default:
        throw new Error(`未知鉴权方式：${auths[0]}`)
    }
  } catch (e: any) {
    return { error: `鉴权失败！${ e.message || JSON.stringify(e) }` }
  }
  return {
    message: '验证通过！'
  }
}

export async function regup(reqBody: { name: string; password: string; code: string }) {
  if ((await db.select(Admin, { name: reqBody.name })).length) {
    return { error: '用户名已经被注册！' }
  }

  if (reqBody.code !== config.secret) {
    return { error: '验证码错误！' }
  }

  reqBody.password = crypto
    .createHmac('sha256', config.secret)
    .update(reqBody.password)
    .digest('hex')

  const newAdm = await db.save(Admin, reqBody)
  delete newAdm.password
  return newAdm
}

export async function refresh() {}
