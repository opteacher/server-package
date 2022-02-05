/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import Path from 'path'
import { db } from '../utils/index.js'
import { readConfig, delDir, copyDir } from '../lib/backend-library/utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import DataBase from '../models/database.js'
import Property from '../models/property.js'
import Service from '../models/service.js'
import Node from '../models/node.js'
import { spawn, spawnSync } from 'child_process'

const svrCfg = readConfig(Path.resolve('configs', 'server'))
const tmpPath = Path.resolve('resources', 'appTemp')

function genAnnotation(
  node: {
    title: string
    inputs: { type: string; remark: string; name: string }[]
    outputs: { type: string; remark: string }[]
  },
  indents: string
): string {
  return (
    node.inputs.length || node.outputs.length
      ? [
          indents + `/** ${node.title}`,
          node.inputs
            .map(input => indents + ` * @param {${input.type}} ${input.name} ${input.remark}`)
            .join('\n'),
          node.outputs
            .map(output => indents + ` * @returns {${output.type}} ${output.remark}`)
            .join('\n'),
          indents + '**/'
        ]
      : [indents + `// ${node.title}`]
  )
    .filter(line => line)
    .join('\n')
}

async function toNext(node: { nexts: any[] }, indent: number, endKey?: string) {
  return node.nexts.length ? await recuNode(node.nexts[0].id, indent, endKey) : []
}

function fmtCode(node: { code: string; inputs: any[]; outputs: any[] }, indents?: string): string {
  let ret = node.code
  if (typeof indents !== 'undefined') {
    ret = ret
      .split('\n')
      .map((line: string) => indents + line)
      .join('\n')
  }
  for (const input of node.inputs) {
    ret = ret.replaceAll(new RegExp(`\\b${input.name}\\b`, 'g'), fmtInput(input))
  }
  for (const output of node.outputs) {
    ret = ret.replaceAll(new RegExp(`\\b${output.name}\\b`, 'g'), output.name)
  }
  return ret
}

function fmtInput(variable: {
  name: string
  type: string
  value: any
  prop?: string
  index?: string
  idxType?: string
}): string {
  const value = variable.value || variable.name
  switch (variable.type) {
    case 'String':
      return `'${value}'`
    case 'Array':
      return `[${value}]`
    case 'Object':
      return `${value}${
        variable.index
          ? variable.idxType === 'String'
            ? "['" + variable.index + "']"
            : '[' + variable.index + ']'
          : ''
      }${variable.prop ? '.' + variable.prop : ''}`
    case 'Number':
    case 'Boolean':
    case 'Any':
    default:
      return value
  }
}

async function recuNode(key: string, indent: number, endKey?: string): Promise<string[]> {
  const node = await db.select(Node, { _index: key }, { ext: true })
  const indents = ''.padStart(indent, ' ')
  switch (node.type) {
    case 'normal': {
      return [[genAnnotation(node, indents), fmtCode(node, indents)].join('\n')].concat(
        await toNext(node, indent, endKey)
      )
    }
    case 'condition': {
      const ret = [genAnnotation(node, indents)]
      for (let i = 0; i < node.nexts.length; ++i) {
        const nxtNode = await db.select(Node, { _index: node.nexts[i] }, { ext: true })
        ret.push(indents + `${i !== 0 ? '} else ' : ''}if (${fmtCode(nxtNode)}) {`)
        if (nxtNode.nexts.length) {
          ret.push(...(await recuNode(nxtNode.nexts[0].id, indent + 2, node.relative)))
        }
        if (i === node.nexts.length - 1) {
          ret.push(indents + '}')
        }
      }
      return ret.concat(await recuNode(node.relative, indent, endKey))
    }
    case 'traversal': {
      if (!node.inputs.length) {
        return ([] as string[]).concat(await toNext(node, indent, endKey))
      }
      const input = node.inputs[0]
      const ret = [
        [
          genAnnotation(node, indents),
          indents + `for (const index in ${fmtInput(input)}) {`,
          indents + `  const item = ${fmtInput(input)}[index]`
        ].join('\n')
      ]
      if (node.nexts.length) {
        ret.push(...(await recuNode(node.nexts[0].id, indent + 2, node.relative)))
      }
      ret.push(indents + '}')
      return ret.concat(await toNext(node, indent, endKey))
    }
    case 'endNode':
      if (node.id === endKey || !node.nexts.length) {
        return []
      } else {
        return await recuNode(node.nexts[0].id, indent, endKey)
      }
    default:
      return []
  }
}

export async function sync(pid: string): Promise<any> {
  console.log('从数据库获取项目实例……')
  const project = await db.select(Project, { _index: pid }, { ext: true })
  if (project.thread) {
    await stop(project)
  }
  console.log('从数据库获取项目模型……')
  for (const index in project.models) {
    const mid = project.models[index]
    project.models[index] = await db.select(Model, { _index: mid }, { ext: true })
  }
  console.log('从数据库获取项目持久化源配置……')
  const database = (await db.select(DataBase, { name: project.database[0] }))[0]

  const genPath = Path.resolve(svrCfg.apps, project.name)
  console.log(`生成项目到目录：${genPath}`)
  try {
    fs.accessSync(genPath)
    delDir(genPath)
  } catch (e) {
    console.log()
  }
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

  fs.mkdirSync(Path.join(genPath, 'views'))
  const vwsTmp = Path.join(tmpPath, 'views')
  const vwsGen = Path.join(genPath, 'views')
  console.log(`复制页面文件夹：${vwsTmp} -> ${vwsGen}`)
  copyDir(vwsTmp, vwsGen)

  const mdlPath = Path.join(genPath, 'models')
  const rotPath = Path.join(genPath, 'routes', project.name)
  const svcPath = Path.join(genPath, 'services')
  fs.mkdirSync(mdlPath)
  fs.mkdirSync(svcPath)
  fs.mkdirSync(rotPath, { recursive: true })
  const mdlTmp = Path.join(tmpPath, 'models', 'temp.js')
  const svcTmp = Path.join(tmpPath, 'services', 'temp.js')
  const rotTmp = Path.join(tmpPath, 'routes', 'index.js')
  const mdlData = fs.readFileSync(mdlTmp)
  const svcData = fs.readFileSync(svcTmp)
  const rotData = fs.readFileSync(rotTmp)
  for (const model of project.models) {
    const svcs = model.svcs.filter((svc: any) => svc.name)
    model.svcs = model.svcs.filter((svc: any) => !svc.name)

    const mdlGen = Path.join(mdlPath, model.name + '.js')
    console.log(`调整模型文件：${mdlTmp} -> ${mdlGen}`)
    adjustFile(mdlData, mdlGen, { model })

    const services = {} as { [aname: string]: any[] }
    for (const svc of svcs) {
      let pamIdx = svc.path.indexOf('/:')
      pamIdx = pamIdx === -1 ? svc.path.length : pamIdx
      const pathPfx = svc.path.substring(0, pamIdx)
      const rotGen = Path.join(rotPath, pathPfx)
      fs.mkdirSync(rotGen, { recursive: true })
      console.log(`调整路由文件：${rotTmp} -> ${rotGen}/index.js`)
      adjustFile(rotData, `${rotGen}/index.js`, { svc, pamIdx })

      const svcExt = await db.select(Service, { _index: svc._id }, { ext: true })
      svcExt.nodes = svcExt.flow ? await recuNode(svcExt.flow.key || svcExt.flow, 2) : []
      if (!(svc.name in services)) {
        services[svc.name] = [svcExt]
      } else {
        services[svc.name].push(svcExt)
      }
    }

    for (const [aname, svcs] of Object.entries(services)) {
      const svcGen = Path.join(svcPath, aname + '.js')
      console.log(`调整服务文件：${svcTmp} -> ${svcGen}`)
      adjustFile(svcData, svcGen, { svcs })
    }
  }

  console.log('更新项目的进程ID……')
  await db.save(Project, { thread: -1 }, { _index: pid })

  console.log('启动项目……')
  const thread = await run(project)
  await adjAndRestartNginx()
  return Promise.resolve(thread)
}

export async function run(pjt: string | { _id: string; name: string }): Promise<number> {
  const project = typeof pjt === 'string' ? await db.select(Project, { _index: pjt }) : pjt
  const appPath = Path.resolve(svrCfg.apps, project.name)
  const appFile = Path.join(appPath, 'app.js')
  try {
    fs.accessSync(appFile)
  } catch (e) {
    // 如果项目的可执行文件不存在，则同步后重启
    await sync(project._id)
    return Promise.resolve(-1)
  }
  try {
    spawnSync([`docker stop ${project.name}`, 'docker container prune -f'].join(' && '), {
      stdio: 'inherit',
      shell: true
    })
  } catch (e) {
    console.log(`无运行中的${project.name}实例`)
  }
  const childPcs = spawn(
    [
      `docker build -t ${project.name}:latest ${appPath}`,
      'docker run --rm -itd ' +
        [
          '--network server-package_default',
          `-p 127.0.0.1:${project.port}:${project.port}`,
          `--name ${project.name} ${project.name}`
        ].join(' ')
    ].join(' && '),
    {
      stdio: 'inherit',
      shell: true,
      env: { ENV: '' } // 暂时不支持环境
    }
  ).on('error', err => {
    console.log(err)
  })
  const thread = childPcs.pid
  console.log('持久化进程id……')
  await db.save(Project, { thread }, { _index: project._id })
  return Promise.resolve(thread || 0)
}

async function adjAndRestartNginx(projects?: { name: string; port: number }[]): Promise<any> {
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
    spawnSync(['docker stop nginx', 'docker container prune -f'].join(' && '), {
      stdio: 'inherit',
      shell: true
    })
  } catch (e) {
    console.log('无运行中的Nginx实例')
  }
  spawnSync(
    [
      'docker run --rm -itd --net host --name nginx nginx',
      `docker container cp ${ngCfgGen} nginx:/etc/nginx/conf.d/default.conf`,
      'docker container restart nginx'
    ].join(' && '),
    {
      stdio: 'inherit',
      shell: true
    }
  )
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
  const slotRegex = /(\/\*|##).*\*\//gm
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
      if (slot[0] - 2 >= 0 && strData.substring(slot[0] - 2, slot[0]) === "''") {
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
  const project = await db.select(Project, { _index: pid })
  if (project.thread) {
    await stop(project)
  }
  for (const mid of project.models) {
    const model = await db.select(Model, { _index: mid })
    for (const ppid of model.props) {
      await db.del(Property, { _index: ppid })
    }
    for (const sid of model.svcs) {
      await db.del(Service, { _index: sid })
    }
    await db.del(Model, { _index: mid })
  }
  return db.del(Project, { _index: pid })
}

export async function stop(pjt: string | { _id: string; thread: number }): Promise<any> {
  const project = typeof pjt === 'string' ? await db.select(Project, { _index: pjt }) : pjt
  spawn(
    [`docker container stop ${project.name}`, `docker container rm ${project.name}`].join(' && '),
    {
      stdio: 'inherit',
      shell: true
    }
  )
  return db.save(Project, { thread: '' }, { _index: project._id }, { updMode: 'delete' })
}

export async function status(pid: string): Promise<any> {
  const project = await db.select(Project, { _index: pid })
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

export async function deploy(
  pid: string,
  cfg: {
    gitURL: string
    name: string
    buildCmd: string
    indexPath: string
    assetsPath: string
  }
): Promise<any> {
  const project = await db.select(Project, { _index: pid })
  const genPath = Path.resolve(svrCfg.apps, project.name, 'temp')
  console.log(`生成页面缓存目录：${genPath}`)
  try {
    fs.accessSync(genPath)
    delDir(genPath)
  } catch (e) {
    console.log()
  }
  fs.mkdirSync(genPath, { recursive: true })

  console.log('开始部署……')
  spawn(
    [
      `git clone ${cfg.gitURL} && cd *`,
      'npm config set registry http://registry.npm.taobao.org',
      'npm install --unsafe-perm=true --allow-root',
      cfg.buildCmd,
      `docker container cp ${cfg.indexPath} ${project.name}:/app/views/index.html`,
      `docker container cp ${cfg.assetsPath} ${project.name}:/app/public/${project.name}/`
    ].join(' && '),
    {
      cwd: genPath,
      stdio: 'inherit',
      shell: true
    }
  )
}

export async function transfer(info: {
  pid: string
  name?: string
  files: { src: string; dest: string }[]
}) {
  if (!info.name) {
    const project = await db.select(Project, { _index: info.pid })
    if (!project.thread) {
      return Promise.resolve('项目未启动')
    }
    info.name = project.name
  }
  const rootPath = `${info.name}:/app`
  console.log('开始传输文件……')
  const cmds = info.files.map((file: { src: string; dest: string }) => {
    console.log(`复制文件：${file.src} -> ${rootPath}${file.dest}`)
    const dir = Path.parse(`/app${file.dest}`).dir
    return [
      `docker exec ${info.name} /bin/mkdir -p ${dir}/`,
      `docker cp ${file.src} ${rootPath}${file.dest}`
    ].join(' && ')
  })
  spawn(cmds.join(' && '), {
    stdio: 'inherit',
    shell: true
  })
}
