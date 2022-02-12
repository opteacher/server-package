/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Model from '../models/model.js'
import Property from '../models/property.js'
import RoleType from '../types/role.js'
import Role from '../models/role.js'
import RuleType from '../types/rule.js'
import Rule from '../models/rule.js'
import Auth from '../models/auth.js'

export async function bind(aid: string, mid: string) {
  const roleProp = RoleType.copy(
    await db.save(
      Property,
      {
        name: 'role',
        label: '角色',
        type: 'String',
        visible: false
      },
      { name: 'role' }
    )
  )
  await db.save(Model, { props: roleProp.key }, { _index: mid }, { updMode: 'append' })
  const guest = RoleType.copy(await db.save(Role, { name: 'guest' }, { name: 'guest' }))
  const allRule = RuleType.copy(
    await db.save(
      Rule,
      {
        method: '*',
        path: '/',
        value: '*/*'
      },
      {
        method: '*',
        path: '/',
        value: '*/*'
      }
    )
  )
  await db.save(Role, { rules: allRule.key }, { _index: guest.key }, { updMode: 'append' })
  return db.save(Auth, { roles: guest.key }, { _index: aid }, { updMode: 'append' })
}
