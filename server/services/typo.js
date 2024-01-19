import Dep from '../models/dep.js'
import Func from '../models/func.js'
import Project from '../models/project.js'
import Typo from '../models/typo.js'
import { db, pickOrIgnore } from '../utils/index.js'

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

export async function update(typo, pid) {
  await db.saveOne(Typo, typo.key, pickOrIgnore(typo, ['funcs']))
  const project = await db.select(Project, { _index: pid }, { ext: true })
  const exsFunKeys = project.typos
    .find(typ => typ.id.toString() === typo.key)
    ?.funcs.map(func => func.id.toString())
  const curFunKeys = new Set(typo.funcs.map(fun => fun.key))
  for (const funKey of exsFunKeys) {
    if (!curFunKeys.has(funKey)) {
      await db.remove(Func, { _index: funKey })
      await db.saveOne(Typo, typo.key, { funcs: funKey }, { updMode: 'delete' })
    }
  }
  const fids = new Set(exsFunKeys)
  for (const func of typo.funcs) {
    if (fids.has(func.key)) {
      await db.saveOne(Func, func.key, pickOrIgnore(func, ['flow']))
    } else {
      const newFun = await db.save(Func, pickOrIgnore(func, ['flow']))
      await db.saveOne(Typo, typo.key, { funcs: newFun.id }, { updMode: 'append' })
    }
  }
  return db.select(Typo, { _index: typo.key })
}

export async function remove(tid, pid) {
  const typo = await db.select(Typo, { _index: tid })
  const project = await db.select(Project, { _index: pid })
  await db.remove(Dep, { belong: project.name, name: typo.name })
  await Promise.all(typo.funcs.map(fid => db.remove(Func, { _index: fid })))
  await db.remove(Typo, { _index: tid })
  await db.saveOne(Project, pid, { typos: tid }, { updMode: 'delete' })
  return typo
}
