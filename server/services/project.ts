import fs from 'fs'
import Path from 'path'
import { getDatabase } from '../utils/index.js'
import { readConfig, delDir } from '../lib/backend-library/utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'

const db = await getDatabase()
const svrCfg = readConfig(Path.resolve('..', 'configs', 'server'))

export async function syncProject (pid: string): Promise<any> {
  const project = (await db.select(Project, { _index: pid }, { ext: true }))[0]
  for (const index in project.models) {
    const mid = project.models[index]
    project.models[index] = (await db.select(Model, { _index: mid }, { ext: true }))[0]
  }
  const genPath = Path.resolve(svrCfg.apps, project.name)
  try {
    fs.accessSync(genPath)
    delDir(genPath)
  } catch (e) {}
  fs.mkdirSync(genPath, { recursive: true })

  fs.mkdirSync(Path.join(genPath, 'configs'))

  const tmpPath = Path.resolve('..', 'resources', 'appTemp')
  if (!adjustFile(
    Path.join(tmpPath, 'app.js'),
    Path.join(genPath, 'app.js'),
    { project }
  )) {
    return Promise.reject()
  }

  const mdlPath = Path.join(genPath, 'models')
  fs.mkdirSync(mdlPath)
  const mdlData = fs.readFileSync(Path.join(tmpPath, 'models', 'temp'))
  for (const model of project.models) {
    if (!adjustFile(mdlData, Path.join(mdlPath, model.name + '.js'), { model })) {
      return Promise.reject()
    }
  }
  return Promise.resolve(project)
}

function adjustFile (src: string | Buffer, dest: string, args: { [name: string]: any }): boolean {
  if (typeof src === 'string') {
    src = fs.readFileSync(src)
  }
  let strData = src.toString()
  const codes = strData.match(/\/\*.*\*\//g)
  if (!codes) {
    return false
  }
  for (const code of codes) {
    const fmtCode = code.substring(2, code.length - 2)
    const func = new Function(...Object.keys(args), fmtCode)
    strData = strData.replaceAll(code, func(...Object.values(args)))
  }
  fs.writeFileSync(dest, strData)
  return true
}
