/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import Path from 'path'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../utils/index.js'
import Admin from '../models/admin.js'
import { readConfig } from '../lib/backend-library/utils/index.js'
import koa from 'koa'

const config = readConfig(Path.resolve('configs', 'server'), false)

export async function login(reqBody: { name: string; password: string }) {
  const result = await db.select(Admin, {
    name: reqBody.name
  })
  if (!result.length) {
    return { error: '用户名不存在' }
  }
  const admin = result[0].toObject()

  if (
    admin.password !==
    crypto.createHmac('sha256', config.secret).update(reqBody.password).digest('hex')
  ) {
    return { error: '错误的登录密码' }
  }

  const payload = {
    sub: admin.id,
    aud: 'server-package',
    iat: Date.now(),
    jti: uuidv4(),
    iss: `server-package/${admin.name}`,
    exp: '1 days'
  }
  delete admin.password
  return {
    admin,
    token: jwt.sign(payload, config.secret),
    message: '登录成功！'
  }
}

export function verify(ctx: koa.Context) {
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
        payload = jwt.verify(tokens[1], config.secret)
        break
      default:
        throw new Error(`未知鉴权方式：${tokens[0]}`)
    }
    return {
      payload,
      message: '验证通过！'
    }
  } catch (e: any) {
    return { error: `鉴权失败！${e.message || JSON.stringify(e)}` }
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

  const newAdm = (await db.save(Admin, reqBody)).toObject()
  delete newAdm.password
  return newAdm
}

export async function refresh() {
  return ''
}
