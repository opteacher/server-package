import fs from 'fs'
import Path from 'path'
import { db } from '../utils/index.js'
import { readConfig, delDir } from '../lib/backend-library/utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import DataBase from '../models/database.js'
import Property from '../models/property.js'
import Route from '../models/route.js'
import { Worker } from 'worker_threads'

const svrCfg = readConfig(Path.resolve('..', 'configs', 'server'))

export async function syncProject (pid: string): Promise<any> {
  const project = (await db.select(Project, { _index: pid }, { ext: true }))[0]
  for (const index in project.models) {
    const mid = project.models[index]
    project.models[index] = (await db.select(Model, { _index: mid }, { ext: true }))[0]
  }
  const database = (await db.select(DataBase, { name: project.database[0] }))[0]

  const genPath = Path.resolve(svrCfg.apps, project.name)
  const tmpPath = Path.resolve('..', 'resources', 'appTemp')
  try {
    fs.accessSync(genPath)
    delDir(genPath)
  } catch (e) {}
  fs.mkdirSync(genPath, { recursive: true })

  fs.mkdirSync(Path.join(genPath, 'configs'))
  adjustFile(
    Path.join(tmpPath, 'configs', 'db.toml'),
    Path.join(genPath, 'configs', 'db.toml'),
    { project, database }
  )
  adjustFile(
    Path.join(tmpPath, 'configs', 'models.toml'),
    Path.join(genPath, 'configs', 'models.toml'),
    { project }
  )

  const appFile = Path.join(genPath, 'app.js')
  adjustFile(
    Path.join(tmpPath, 'app.js'),
    appFile, { project }
  )

  fs.mkdirSync(Path.join(genPath, 'utils'))
  adjustFile(
    Path.join(tmpPath, 'utils', 'index.js'),
    Path.join(genPath, 'utils', 'index.js'),
  )

  const mdlPath = Path.join(genPath, 'models')
  fs.mkdirSync(mdlPath)
  const mdlData = fs.readFileSync(Path.join(tmpPath, 'models', 'temp'))
  for (const model of project.models) {
    adjustFile(mdlData, Path.join(mdlPath, model.name + '.js'), { model })
  }
  return new Promise((res, rej) => {
    process.chdir(genPath)
    const worker = new Worker('./app.js', {
      env: { ENV: '' }
    })
    worker.on('message', res)
    worker.on('error', rej)
    worker.on('exit', code => {
      if (!code) {
        rej(new Error(`线程已停止，返回码${code}`))
      }
    })
  })
}

function adjustFile (src: string | Buffer, dest: string, args?: { [name: string]: any }): void {
  if (!args) {
    args = {}
  }
  if (typeof src === 'string') {
    src = fs.readFileSync(src)
  }
  let strData = src.toString()
  const codes = strData.match(/\/\*.*\*\//g)
  if (!codes) {
    fs.writeFileSync(dest, strData)
    return
  }
  for (const code of codes) {
    const fmtCode = code.substring(2, code.length - 2)
    const func = new Function(...Object.keys(args), fmtCode)
    strData = strData.replaceAll(code, func(...Object.values(args)))
  }
  fs.writeFileSync(dest, strData)
}

export async function delProject (pid: string): Promise<any> {
  const project = (await db.select(Project, { _index: pid }))[0]
  for (const mid of project.models) {
    const model = (await db.select(Model, { _index: mid }))[0]
    for (const ppid of model.props) {
      await db.del(Property, { _index: ppid })
    }
    for (const rid of model.routes) {
      await db.del(Route, { _index: rid })
    }
    await db.del(Model, { _index: mid })
  }
  return db.del(Project, { _index: pid })
}
