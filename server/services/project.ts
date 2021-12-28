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

const workers: { [thread: number]: Worker } = {}

export async function sync (pid: string): Promise<any> {
  const project = (await db.select(Project, { _index: pid }, { ext: true }))[0]
  if (project.thread) {
    return Promise.resolve(`项目已启动`)
  }
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
  // 切换生成项目的上下文
  process.chdir(genPath)
  const worker = new Worker('./app.js', {
    env: { ENV: '' }
  })
  worker.on('message', msg => {
    console.log(msg)
  })
  worker.on('error', err => {
    console.log(err)
  })
  worker.on('exit', code => {
    if (!code) {
      console.log(`线程已停止，返回码${code}`)
    }
  })
  workers[worker.threadId] = worker
  await db.save(Project, { thread: worker.threadId }, { _index: pid })
  return Promise.resolve(worker.threadId)
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

export async function del (pid: string): Promise<any> {
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

export async function stop (pid: string): Promise<any> {
  const project = (await db.select(Project, { _index: pid }))[0]
  if (project.thread in workers) {
    await workers[project.thread].terminate()
    delete workers[project.thread]
  }
  return await db.save(Project, { thread: 0 }, { _index: pid })
}

export async function showStatus (pid: string): Promise<any> {
  const project = (await db.select(Project, { _index: pid }))[0]
  if (!project.thread) {
    return Promise.resolve({
      status: 'stopped'
    })
  } else {
    return Promise.resolve({
      status: 'running',
      threadId: project.thread
    })
  }
}
