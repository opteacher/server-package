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

export async function sync(pid: string): Promise<any> {
  const project = (await db.select(Project, { _index: pid }, { ext: true }))[0]
  if (project.thread) {
    await stop(project)
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
  adjustFile(Path.join(tmpPath, 'configs', 'db'), Path.join(genPath, 'configs', 'db.toml'), {
    project,
    database
  })
  adjustFile(
    Path.join(tmpPath, 'configs', 'models'),
    Path.join(genPath, 'configs', 'models.toml'),
    { project }
  )

  const appFile = Path.join(genPath, 'app.js')
  adjustFile(Path.join(tmpPath, 'app'), appFile, { project, svrCfg })

  fs.mkdirSync(Path.join(genPath, 'utils'))
  adjustFile(Path.join(tmpPath, 'utils', 'index'), Path.join(genPath, 'utils', 'index.js'), {
    project,
    svrCfg
  })

  const mdlPath = Path.join(genPath, 'models')
  fs.mkdirSync(mdlPath)
  const mdlData = fs.readFileSync(Path.join(tmpPath, 'models', 'temp'))
  for (const model of project.models) {
    adjustFile(mdlData, Path.join(mdlPath, model.name + '.js'), { model })
  }

  // 调整docker和nginx的配置
  fixDockerAndNginx()

  await db.save(Project, { thread: -1 }, { _index: pid })
  // 重启本服务
  if (process.send) {
    process.send('restart')
  }
  return Promise.resolve()
}

async function fixDockerAndNginx(projects?: any[]) {
  if (!projects) {
    projects = await db.select(Project)
  }
  const runnings = projects?.filter((project: any) => project.thread as boolean)

  const tmpPath = Path.resolve('..', 'resources', 'appTemp')
  const dkrFilePath = Path.join(tmpPath, 'Dockerfile')
  const dkrCmpsPath = Path.join(tmpPath, 'docker-compose')

  const rootPath = Path.resolve('..', '..')
  adjustFile(dkrFilePath, Path.join(rootPath, 'Dockerfile'), { projects: runnings })
  adjustFile(dkrCmpsPath, Path.join(rootPath, 'docker-compose.yml'), { projects: runnings })
}

export async function run(pjt: string | { _id: string; name: string }): Promise<number> {
  const project = typeof pjt === 'string' ? (await db.select(Project, { _index: pjt }))[0] : pjt
  const appFile = Path.resolve(svrCfg.apps, project.name, 'app.js')
  try {
    fs.accessSync(appFile)
  } catch (e) {
    // 如果项目的可执行文件不存在，则同步后重启
    await sync(project._id)
    return Promise.resolve(-1)
  }
  const worker = new Worker(appFile, {
    env: { ENV: '' } // 暂时不支持环境
  })
  worker.on('message', msg => {
    console.log(msg)
  })
  worker.on('error', err => {
    console.log(err)
  })
  worker.on('exit', code => {
    console.log(`工作线程已停止${!code ? '，异常返回码' + code : ''}`)
  })
  workers[worker.threadId] = worker
  await db.save(Project, { thread: worker.threadId }, { _index: project._id })
  return Promise.resolve(worker.threadId)
}

export async function runAll(): Promise<void> {
  const projects = await db.select(Project)
  await fixDockerAndNginx(projects)
  projects.map((project: any) => {
    if (project.thread) {
      try {
        run(project)
      } catch (e) {
        console.log(e)
      }
    }
  })
}

function adjustFile(
  src: string | Buffer,
  dest?: string,
  args?: { [name: string]: any }
): string | void {
  if (!args) {
    args = {}
  }
  if (typeof src === 'string') {
    src = fs.readFileSync(src)
  }
  let strData = src.toString()
  const codes = strData.match(/\/\*.*\*\//g)
  if (codes) {
    for (const code of codes) {
      const fmtCode = code.substring(2, code.length - 2)
      const func = new Function(...Object.keys(args), fmtCode)
      strData = strData.replaceAll(code, func(...Object.values(args)))
    }
  }
  return dest ? fs.writeFileSync(dest, strData) : strData
}

export async function del(pid: string): Promise<any> {
  const project = (await db.select(Project, { _index: pid }))[0]
  if (project.thread) {
    await stop(project)
  }
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

export async function stop(pjt: string | { _id: string; thread: number }): Promise<any> {
  const project = typeof pjt === 'string' ? (await db.select(Project, { _index: pjt }))[0] : pjt
  if (project.thread in workers) {
    await workers[project.thread].terminate()
    delete workers[project.thread]
  }
  return db.save(Project, { thread: 0 }, { _index: project._id })
}

export async function status(pid: string): Promise<any> {
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
