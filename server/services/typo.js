import Dep from '../models/dep.js'
import Func from '../models/func.js'
import Project from '../models/project.js'
import Typo from '../models/typo.js'
import Node from '../models/node.js'
import { db, pickOrIgnore } from '../utils/index.js'
import { colcNodes } from './service.js'

export async function add(typo, pid) {
  const newTyp = await db.save(Typo, pickOrIgnore(typo, ['funcs']))
  await db.saveOne(Project, pid, { typos: newTyp }, { updMode: 'append' })
  for (const func of typo.funcs) {
    const newFun = await db.save(Func, func)
    await db.saveOne(Typo, newTyp.id, { funcs: newFun.id }, { updMode: 'append' })
  }
  const project = await db.select(Project, { _index: pid })
  await db.save(Dep, {
    name: newTyp.name,
    exports: [newTyp.name],
    from: `../types/${newTyp.name}.js`,
    default: true,
    belong: project.name
  })
  return newTyp
}

export async function update(typo) {
  const funcs = []
  for (const func of typo.funcs) {
    if (func.key) {
      funcs.push(func.key)
    } else {
      const newFun = await db.save(Func, pickOrIgnore(func, ['flow']))
      funcs.push(newFun._id.toString())
    }
  }
  return db.saveOne(
    Typo,
    typo.key,
    Object.assign(typo, { funcs })
  )
}

export async function remove(tid, pid) {
  const typo = await db.select(Typo, { _index: tid })
  const project = await db.select(Project, { _index: pid })
  await db.remove(Dep, { belong: project.name, name: typo.name })
  for (const func of await Promise.all(typo.funcs.map(fid => db.select(Func, { _index: fid })))) {
    const nodes = await colcNodes(func.flow)
    await Promise.all(nodes.map(node => db.remove(Node, { _index: node.key })))
    await db.remove(Func, { _index: func.id })
  }
  await db.remove(Typo, { _index: tid })
  await db.saveOne(Project, pid, { typos: tid }, { updMode: 'delete' })
  return typo
}
