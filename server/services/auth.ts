/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Project from '../models/project.js'
import ProjectType from '../types/project.js'
import Model from '../models/model.js'
import Property from '../models/property.js'
import RoleType from '../types/role.js'
import Role from '../models/role.js'
import RuleType from '../types/rule.js'
import Rule from '../models/rule.js'
import Auth from '../models/auth.js'
import AuthType from '../types/auth.js'
import API from '../models/api.js'

export async function genGuest(auth: AuthType) {
  let ret = auth.roles.find(role => role.name === 'role')
  if (ret) {
    return ret
  }
  const roleProp = await db.save(Property, {
    name: 'role',
    label: '角色',
    type: 'String',
    visible: false
  })
  await db.save(Model, { props: roleProp.id }, { _index: auth.model }, { updMode: 'append' })
  const guest = RoleType.copy(await db.save(Role, { name: 'guest' }))
  const allRule = RuleType.copy(await db.save(Rule, { method: '*', path: '/', value: '*/*' }))
  ret = await db.save(Role, { rules: allRule.key }, { updMode: 'append' })
  await db.save(Auth, { roles: guest.key }, { _index: auth.key }, { updMode: 'append' })
  return ret
}

export async function saveAuth(pid: string, auth: any) {
  const project = ProjectType.copy(await db.select(Project, { _index: pid }))
  delete auth.roles
  delete auth.apis
  const idxCond = project.auth && project.auth.key ? { _index: project.auth.key } : undefined
  auth = AuthType.copy(await db.save(Auth, auth, idxCond))
  await db.save(Project, { auth: auth.key }, { _index: project.key }, { updMode: 'append' })
  if (auth.model) {
    genGuest(auth)
  }
  return auth
}

export async function delAuth(pid: string) {
  const project = await db.select(Project, { _index: pid })
  const auth = AuthType.copy(await db.select(Auth, { _index: project.auth }, { ext: true }))
  await Promise.all(auth.apis.map(api => db.del(API, { _index: api.key })))
  for (const role of auth.roles) {
    await Promise.all(role.rules.map(rule => db.del(Rule, { _index: rule })))
  }
  await db.del(Auth, { _index: project.auth })
  return db.save(Project, { auth: project.auth }, { _index: pid }, { updMode: 'delete' })
}
