import fs from 'fs'
import Path from 'path'
import { db } from '../utils/index.js'
import { readConfig, delDir, copyDir } from '../lib/backend-library/utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import DataBase from '../models/database.js'
import Property from '../models/property.js'
import Route from '../models/route.js'
import { Worker } from 'worker_threads'
import { spawn, spawnSync } from 'child_process'

const svrCfg = readConfig(Path.resolve('configs', 'server'))
const tmpPath = Path.resolve('resources', 'appTemp')

const workers: { [thread: number]: Worker } = {}

export async function sync(pid: string): Promise<any> {
  console.log('从数据库获取项目实例……')
  const project = (await db.select(Project, { _index: pid }, { ext: true }))[0]
  if (project.thread) {
    await stop(project)
  }
  console.log('从数据库获取项目模型……')
  for (const index in project.models) {
    const mid = project.models[index]
    project.models[index] = (await db.select(Model, { _index: mid }, { ext: true }))[0]
  }
  console.log('从数据库获取项目持久化源配置……')
  const database = (await db.select(DataBase, { name: project.database[0] }))[0]

  const genPath = Path.resolve(svrCfg.apps, project.name)
  console.log(`生成项目到目录：${genPath}`)
  try {
    fs.accessSync(genPath)
    delDir(genPath)
  } catch (e) {}
  fs.mkdirSync(genPath, { recursive: true })

  fs.mkdirSync(Path.join(genPath, 'configs'))
  const dbCfgTmp = Path.join(tmpPath, 'configs', 'db.toml')
  const dbCfgGen = Path.join(genPath, 'configs', 'db.toml')
  console.log(`调整数据源配置文件：${dbCfgTmp} -> ${dbCfgGen}`)
  adjustFile(dbCfgTmp, dbCfgGen, { project, database })
  const mdlCfgTmp = Path.join(tmpPath, 'configs', 'models.toml')
  const mdlCfgGen = Path.join(genPath, 'configs', 'models.toml')
  console.log(`调整模型配置文件：${mdlCfgTmp} -> ${mdlCfgGen}`)
  adjustFile(mdlCfgTmp, mdlCfgGen, { project })

  const appTmp = Path.join(tmpPath, 'app.js')
  const appGen = Path.join(genPath, 'app.js')
  console.log(`调整应用文件：${appTmp} -> ${appGen}`)
  adjustFile(appTmp, appGen, { project })

  const dkrTmp = Path.join(tmpPath, 'Dockerfile')
  const dkrGen = Path.join(genPath, 'Dockerfile')
  console.log(`调整Dockerfile文件：${dkrTmp} -> ${dkrGen}`)
  adjustFile(dkrTmp, dkrGen, { project })

  const pkgTmp = Path.join(tmpPath, 'package.json')
  const pkgGen = Path.join(genPath, 'package.json')
  console.log(`调整package文件：${pkgTmp} -> ${pkgGen}`)
  adjustFile(pkgTmp, pkgGen, { project })

  const libTmp = Path.resolve('lib')
  const libGen = Path.join(genPath, 'lib')
  console.log(`复制库文件夹：${libTmp} -> ${libGen}`)
  copyDir(libTmp, libGen)

  fs.mkdirSync(Path.join(genPath, 'utils'))
  const utilsTmp = Path.join(tmpPath, 'utils', 'index.js')
  const utilsGen = Path.join(genPath, 'utils', 'index.js')
  console.log(`调整工具文件：${utilsTmp} -> ${utilsGen}`)
  adjustFile(utilsTmp, utilsGen)

  const mdlPath = Path.join(genPath, 'models')
  fs.mkdirSync(mdlPath)
  const mdlTmp = Path.join(tmpPath, 'models', 'temp.js')
  const mdlData = fs.readFileSync(mdlTmp)
  for (const model of project.models) {
    const mdlGen = Path.join(mdlPath, model.name + '.js')
    console.log(`调整模型文件：${mdlTmp} -> ${mdlGen}`)
    adjustFile(mdlData, mdlGen, { model })
  }

  console.log('更新项目的进程ID……')
  await db.save(Project, { thread: -1 }, { _index: pid })

  console.log('启动项目……')
  await run(project)
  await adjAndRestartNginx()
  return Promise.resolve()
}

export async function run(pjt: string | { _id: string; name: string }): Promise<number> {
  const project = typeof pjt === 'string' ? (await db.select(Project, { _index: pjt }))[0] : pjt
  const appPath = Path.resolve(svrCfg.apps, project.name)
  const appFile = Path.join(appPath, 'app.js')
  try {
    fs.accessSync(appFile)
  } catch (e) {
    // 如果项目的可执行文件不存在，则同步后重启
    await sync(project._id)
    return Promise.resolve(-1)
  }
  let thread: number | undefined
  if (process.env.ENV === 'prod') {
    try {
      spawnSync([
        'docker stop nginx',
        'docker container prune -f'
      ].join(' && '), {
        stdio: 'inherit',
        shell: true,
      })
    } catch (e) {
      console.log(`无运行中的${project.name}实例`)
    }
    const childPcs = spawn([
      `docker build -t ${project.name}:latest ${appPath}`,
      'docker run --rm -itd ' + [
        `-p 127.0.0.1:${project.port}:${project.port}`,
        `--name ${project.name} ${project.name}`
      ].join(' ')
    ].join(' && '), {
      stdio: 'inherit',
      shell: true,
      env: { ENV: '' } // 暂时不支持环境
    }).on('error', err => {
      console.log(err)
    })
    thread = childPcs.pid
  } else {
    const worker = new Worker(appFile, {
      env: { ENV: '' } // 暂时不支持环境
    })
    worker.on('error', err => {
      console.log(err)
    })
    worker.on('exit', code => {
      console.log(`工作线程已停止${!code ? '，异常返回码' + code : ''}`)
    })
    workers[worker.threadId] = worker
    thread = worker.threadId
  }
  await db.save(Project, { thread }, { _index: project._id })
  return Promise.resolve(thread || 0)
}

async function adjAndRestartNginx (projects?: { name: string, port: number }[]): Promise<any> {
  if (process.env.ENV !== 'prod') {
    return Promise.resolve()
  }
  if (typeof projects === 'undefined') {
    projects = await db.select(Project)
  }
  const ngCfgTmp = Path.resolve('resources', 'ngTemp', 'nginx.conf')
  const ngCfgGen = Path.resolve('configs', 'nginx.conf')
  console.log(`调整Nginx配置文件：${ngCfgTmp} -> ${ngCfgGen}`)
  adjustFile(ngCfgTmp, ngCfgGen, { projects })

  console.log('重启Nginx……')
  try {
    spawnSync([
      'docker stop nginx',
      'docker container prune -f'
    ].join(' && '), {
      stdio: 'inherit',
      shell: true,
    })
  } catch (e) {
    console.log('无运行中的Nginx实例')
  }
  spawnSync([
    'docker run --rm -itd ' + [
      '--net host',
      '--name nginx nginx',
    ].join(' '), [
      'docker container cp',
      ngCfgGen,
      'nginx:/etc/nginx/conf.d/default.conf'
    ].join(' '),
    'docker container restart nginx'
  ].join(' && '), {
    stdio: 'inherit',
    shell: true,
  })
}

export async function runAll(): Promise<void> {
  const projects = await db.select(Project)
  await adjAndRestartNginx(projects)
  projects.map((project: any) => {
    if (project.thread) {
      run(project)
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
  const strData = src.toString()
  const slotRegex = /(\/\*|\#\#).*\*\//mg
  let resAry: RegExpExecArray | null = null
  const slots: [number, number][] = []
  while ((resAry = slotRegex.exec(strData)) !== null) {
    slots.push([resAry.index, slotRegex.lastIndex])
  }
  let writeData = ''
  if (slots.length) {
    let curIdx = 0
    for (let i = 0; i < slots.length; ++i) {
      const slot = slots[i]
      let begIdx = slot[0]
      if (slot[0] - 2 >= 0 && strData.substring(slot[0] - 2, slot[0]) === '\'\'') {
        begIdx -= 2
      } else if (slot[0] - 1 >= 0 && strData.substring(slot[0] - 1, slot[0]) === '0') {
        begIdx -= 1
      }
      const fmtCode = strData.substring(slot[0] + 2, slot[1] - 2)
      const func = new Function(...Object.keys(args), fmtCode)
      writeData += [
        strData.substring(curIdx, begIdx),
        func(...Object.values(args)),
        i === slots.length - 1 ? strData.substring(slot[1]) : ''
      ].join('')
      curIdx = slot[1]
    }
  } else {
    writeData = strData
  }
  return dest ? fs.writeFileSync(dest, writeData) : writeData
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
  } else if (project.thread) {
    spawn([
      `docker container stop ${project.name}`,
      `docker container rm ${project.name}`
    ].join(' && '), {
      stdio: 'inherit',
      shell: true
    })
  }
  return db.save(Project, { thread: '' }, { _index: project._id }, { updMode: 'delete' })
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
