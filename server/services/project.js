/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from 'fs'
import Path from 'path'
import { db, pickOrIgnore } from '../utils/index.js'
import { readConfig, copyDir, rmvStartsOf } from '../lib/backend-library/utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import DataBase from '../models/database.js'
import Service from '../models/service.js'
import Node from '../models/node.js'
import Dep from '../models/dep.js'
import { spawn, spawnSync } from 'child_process'
import axios from 'axios'
import { exportClass } from './model.js'
import sendfile from 'koa-sendfile'

const svrCfg = readConfig(Path.resolve('configs', 'server'))
const tmpPath = Path.resolve('resources', 'app-temp')

function formatToStr(value, vtype) {
  if (typeof value === 'undefined' || value === null) {
    return
  }
  switch (vtype) {
    case 'String':
      return `\'${value}\'`
    case 'DateTime':
      return value.toString().toLowerCase() === 'now'
        ? 'Date.now'
        : `new Date(${typeof value === 'string' ? "'" + value + "'" : value})`
    case 'Array':
      return `[${value.map(val => "'" + val + "'").join(', ')}]`
    case 'Object':
      return JSON.stringify(value)
    case 'Boolean':
      return value ? 'true' : 'false'
    case 'Any':
    case 'Number':
    default:
      return value.toString()
  }
}

/**
 *
 * @param {*} node {
    title: string
    inputs: { type: string; remark: string; name: string }[]
    outputs: { type: string; remark: string }[]
  }
 * @param {*} indents
 * @returns
 */
function genAnnotation(node, indents) {
  return (
    node.inputs.length || node.outputs.length
      ? [
          indents + `/** ${node.title}`,
          node.inputs
            .map(input => indents + ` * @param {${input.vtype}} ${input.name} ${input.remark}`)
            .join('\n'),
          node.outputs
            .map(output => indents + ` * @returns {${output.vtype}} ${output.remark}`)
            .join('\n'),
          indents + '**/'
        ]
      : [indents + `// ${node.title}`]
  )
    .filter(line => line)
    .join('\n')
}

/**
 *
 * @param {*} node { code: string; isFun: boolean; inputs: any[]; outputs: any[] }
 * @param {*} indents
 * @returns
 */
function fmtCode(node, indents) {
  if (!indents) {
    indents = ''
  }
  if (node.isFun) {
    let ret = indents
    if (node.outputs.length) {
      ret += `const { ${node.outputs
        .map(opt => opt.name + (opt.value ? `: ${opt.value}` : ''))
        .join(', ')} } = `
    }
    ret += `await (async (${node.inputs.map(ipt => ipt.name).join(', ')}) => {\n`
    ret +=
      node.code
        .split('\n')
        .filter(line => line)
        .map(line => indents + '  ' + line)
        .join('\n') + '\n'
    if (node.outputs.length) {
      ret += indents + '  ' + `return { ${node.outputs.map(opt => opt.name).join(', ')} }\n`
    }
    ret += indents + `})(${node.inputs.map(fmtInput).join(', ')})`
    return ret
  } else {
    let ret = node.code
      .split('\n')
      .filter(line => line)
      .map(line => indents + line)
      .join('\n')
    for (const input of node.inputs) {
      ret = ret.replaceAll(new RegExp(`\\b${input.name}\\b`, 'g'), fmtInput(input))
    }
    for (const output of node.outputs) {
      ret = ret.replaceAll(new RegExp(`\\b${output.name}\\b`, 'g'), fmtOutput(output))
    }
    return ret
  }
}

/**
 *
 * @param {*} variable { name: string; value: any }
 * @returns
 */
function fmtOutput(variable) {
  return variable.value || variable.name
}

/**
 *
 * @param {*} variable {
    name: string
    type: string
    value: any
    prop?: string
    index?: string
    idxType?: string
  }
 * @returns
 */
function fmtInput(variable) {
  const value = variable.value || variable.name
  switch (variable.vtype) {
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

async function recuNode(key, indent, callback, endKey) {
  const node = await db.select(Node, { _index: key }, { ext: true })
  callback(node)
  const indents = ''.padStart(indent, ' ')
  switch (node.ntype) {
    case 'normal': {
      return [[genAnnotation(node, indents), fmtCode(node, indents)].join('\n')].concat(
        node.nexts.length ? await recuNode(node.nexts[0].id, indent, callback, endKey) : []
      )
    }
    case 'condition': {
      const ret = [genAnnotation(node, indents)]
      for (let i = 0; i < node.nexts.length; ++i) {
        const nxtNode = await db.select(Node, { _index: node.nexts[i].id })
        ret.push(indents + `${i !== 0 ? '} else ' : ''}if (${fmtCode(nxtNode)}) {`)
        if (nxtNode.nexts.length) {
          ret.push(...(await recuNode(nxtNode.nexts[0], indent + 2, callback, node.relative)))
        }
        if (i === node.nexts.length - 1) {
          ret.push(indents + '}')
        }
      }
      return ret.concat(await recuNode(node.relative, indent, callback, endKey))
    }
    case 'traversal': {
      if (!node.inputs.length) {
        return [].concat(await recuNode(node.relative, indent, callback))
      }
      const input = node.inputs[0]
      const output = node.outputs[0]
      const ret = [
        [
          genAnnotation(node, indents),
          '\n' + indents,
          `for (const ${fmtOutput(output)} of ${fmtInput(input)}) {`
        ].join('')
      ]
      if (node.nexts.length) {
        ret.push(...(await recuNode(node.nexts[0].id, indent + 2, callback, node.relative)))
      }
      ret.push(indents + '}')
      return ret.concat(await recuNode(node.relative, indent, callback, endKey))
    }
    case 'endNode':
      if (node.id === endKey || !node.nexts.length) {
        return []
      } else {
        return await recuNode(node.nexts[0].id, indent, callback, endKey)
      }
    default:
      return []
  }
}

export async function sync(pid) {
  console.log('更新项目的进程ID……')
  await db.save(Project, { thread: -1 }, { _index: pid })

  setTimeout(async () => {
    const project = await generate(pid)

    console.log('启动项目……')
    await run(project)
    await adjAndRestartNginx()
  }, 10)
  return Promise.resolve({ message: '同步中……' })
}

export async function generate(pid) {
  console.log('从数据库获取项目实例……')
  const project = await db.select(Project, { _index: pid }, { ext: true })
  if (project.thread) {
    await stopSync(project)
  }
  console.log('从数据库获取项目模型……')
  for (const index in project.models) {
    const mid = project.models[index]
    project.models[index] = await db.select(Model, { _index: mid }, { ext: true })
  }
  if (!project.auth) {
    project.auth = {}
  }
  console.log('从数据库获取项目持久化源配置……')
  const database = (await db.select(DataBase, { name: project.database[0] }))[0]

  const genPath = Path.resolve(svrCfg.apps, project.name)
  console.log(`生成项目到目录：${genPath}`)
  fs.rmSync(genPath, { recursive: true, force: true })
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
  if (project.independ) {
    const svrCfgTmp = Path.join(tmpPath, 'configs', 'server.toml')
    const svrCfgGen = Path.join(genPath, 'configs', 'server.toml')
    console.log(`调整服务配置文件：${svrCfgTmp} -> ${svrCfgGen}`)
    adjustFile(svrCfgTmp, svrCfgGen, { secret: svrCfg.secret })
  }

  const appTmp = Path.join(tmpPath, 'app.js')
  const appGen = Path.join(genPath, 'app.js')
  console.log(`调整应用文件：${appTmp} -> ${appGen}`)
  adjustFile(appTmp, appGen, { project })

  const dkrTmp = Path.join(tmpPath, 'Dockerfile')
  const dkrGen = Path.join(genPath, 'Dockerfile')
  console.log(`调整Dockerfile文件：${dkrTmp} -> ${dkrGen}`)
  adjustFile(dkrTmp, dkrGen, { project })

  const libTmp = Path.resolve('lib')
  const libGen = Path.join(genPath, 'lib')
  console.log(`复制库文件夹：${libTmp} -> ${libGen}`)
  copyDir(libTmp, libGen, { ignores: ['node_modules'] })

  fs.mkdirSync(Path.join(genPath, 'utils'))
  const utilsTmp = Path.join(tmpPath, 'utils', 'index.js')
  const utilsGen = Path.join(genPath, 'utils', 'index.js')
  console.log(`调整工具文件：${utilsTmp} -> ${utilsGen}`)
  adjustFile(utilsTmp, utilsGen)

  console.log(`生成public文件夹：${Path.join(genPath, 'public')}`)
  fs.mkdirSync(Path.join(genPath, 'public'))

  const deps = {}
  const svcPath = Path.join(genPath, 'services')
  fs.mkdirSync(svcPath)
  if (project.auth.model) {
    Object.assign(deps, await genAuth(project, tmpPath, genPath))
  }

  fs.mkdirSync(Path.join(genPath, 'views'))
  const vwsTmp = Path.join(tmpPath, 'views')
  const vwsGen = Path.join(genPath, 'views')
  console.log(`复制页面文件夹：${vwsTmp} -> ${vwsGen}`)
  copyDir(vwsTmp, vwsGen)

  const mdlPath = Path.join(genPath, 'models')
  const rotPath = Path.join(genPath, 'routes', project.name)
  fs.mkdirSync(mdlPath)
  fs.mkdirSync(rotPath, { recursive: true })
  const mdlTmp = Path.join(tmpPath, 'models', 'temp.js')
  const svcTmp = Path.join(tmpPath, 'services', 'temp.js')
  const rotTmp = Path.join(tmpPath, 'routes', 'index.js')
  const mdlData = fs.readFileSync(mdlTmp)
  const svcData = fs.readFileSync(svcTmp)
  const rotData = fs.readFileSync(rotTmp)
  for (const model of project.models) {
    const svcs = model.svcs.filter(svc => !svc.isModel)
    model.svcs = model.svcs.filter(svc => svc.isModel)

    model.props = model.props.map(prop =>
      Object.assign(prop, { default: formatToStr(prop.default, prop.ptype) })
    )

    const mdlGen = Path.join(mdlPath, model.name + '.js')
    console.log(`调整模型文件：${mdlTmp} -> ${mdlGen}`)
    adjustFile(mdlData, mdlGen, { model })

    const services = {}
    const svcRts = {}
    for (const svc of svcs) {
      let pamIdx = svc.path.indexOf('/:')
      pamIdx = pamIdx === -1 ? svc.path.length : pamIdx
      const pathPfx = svc.path.substring(0, pamIdx)
      const rotGen = Path.join(rotPath, pathPfx)
      fs.mkdirSync(rotGen, { recursive: true })
      if (rotGen in svcRts) {
        svcRts[rotGen].push({ svc, pamIdx })
      } else {
        svcRts[rotGen] = [{ svc, pamIdx }]
      }

      if (svc.name === 'auth') {
        console.log('跳过授权服务')
        continue
      }

      console.log('收集项目依赖模块：')
      const svcExt = await db.select(Service, { _index: svc.id }, { ext: true })
      svcExt.deps = []
      svcExt.nodes = svcExt.flow
        ? await recuNode(svcExt.flow.id, 4, node => {
            if (node.deps) {
              for (const dep of node.deps) {
                if (!(dep.id in deps)) {
                  console.log(`\t${dep.name}: ${dep.version}`)
                  deps[dep.id] = dep
                }
                svcExt.deps.push(dep)
              }
            }
          })
        : []
      if (!(svc.name in services)) {
        services[svc.name] = [svcExt]
      } else {
        services[svc.name].push(svcExt)
      }
    }

    for (const [rotGen, svcs] of Object.entries(svcRts)) {
      console.log(`调整路由文件：${rotTmp} -> ${rotGen}/index.js`)
      adjustFile(rotData, `${rotGen}/index.js`, { svcs })
    }

    for (const [aname, svcs] of Object.entries(services)) {
      const svcGen = Path.join(svcPath, aname + '.js')
      console.log(`调整服务文件：${svcTmp} -> ${svcGen}`)
      adjustFile(svcData, svcGen, { svcs })
    }
  }
  const pkgTmp = Path.join(tmpPath, 'package.json')
  const pkgGen = Path.join(genPath, 'package.json')
  console.log(`调整package文件：${pkgTmp} -> ${pkgGen}`)
  adjustFile(pkgTmp, pkgGen, {
    project,
    pkgDeps: Object.values(deps).filter(dep => dep.version)
  })
  return project
}

export async function genAuth(project, tmpPath, genPath) {
  const deps = {}
  const authTmp = Path.join(tmpPath, 'services', 'auth.js')
  const authGen = Path.join(genPath, 'services', 'auth.js')
  console.log(`复制授权服务文件：${authTmp} -> ${authGen}`)
  const apis = await getAllAPIs(project.id)
  const args = {
    secret: svrCfg.secret,
    project,
    mdlName: 'test',
    skips: project.auth.skips || [],
    apis: apis
      .filter(api => api.name !== 'auth')
      .map(api => {
        if (api.path.includes(':')) {
          api.path = new RegExp(`/${project.name}${api.path.replace(/:([^\/]*)/g, '([^/]*)')}`)
        } else {
          api.path = `/${project.name}${api.path}`
        }
        api.method = api.method.toUpperCase()
        return api
      }),
    nodes: [],
    deps: []
  }
  const authMdl = await db.select(Model, { _index: project.auth.model }, { ext: true })
  const authSvc = authMdl.svcs.find(svc => svc.name === 'auth' && svc.interface === 'sign')
  const mdlDep = await db.select(Dep, { _index: project.auth.model })
  args.mdlName = mdlDep.exports[0]
  deps[mdlDep.id] = mdlDep.toObject()
  if (authSvc && authSvc.flow) {
    args.nodes = await recuNode(authSvc.flow, 4, node => {
      for (const dep of node.deps) {
        if (!(dep.id in deps)) {
          deps[dep.id] = dep.toObject()
        }
      }
    })
    args.deps = Object.values(deps)
  }
  adjustFile(fs.readFileSync(authTmp), authGen, args)
  return deps
}

/**
 *
 * @param {*} pjt string | { _id: string; name: string }
 * @returns
 */
export async function run(pjt) {
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
          ...project.expPorts.map(port => `-p 127.0.0.1:${port}:${port}`),
          `--name ${project.name} ${project.name}`
        ].join(' ')
    ].join(' && '),
    {
      stdio: 'inherit',
      shell: true,
      env: { NODE_ENV: '' } // 暂时不支持环境
    }
  ).on('error', err => {
    console.log(err)
  })
  const thread = childPcs.pid
  console.log('持久化进程id……')
  await db.save(Project, { thread }, { _index: project._id })
  return Promise.resolve(thread || 0)
}

/**
 *
 * @param {*} projects { name: string; port: number }[]
 * @returns
 */
async function adjAndRestartNginx(projects) {
  if (process.env.NODE_ENV !== 'prod') {
    return Promise.resolve()
  }
  if (typeof projects === 'undefined') {
    projects = await db.select(Project)
  }
  const ngCfgTmp = Path.resolve('resources', 'ng-temp', 'nginx.conf')
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

export async function runAll() {
  const projects = await db.select(Project)
  await adjAndRestartNginx(projects)
  projects.map(project => {
    if (project.thread) {
      run(project)
    }
  })
}

/**
 *
 * @param {*} src string | Buffer
 * @param {*} dest ?string
 * @param {*} args ?{ [name: string]: any }
 * @returns
 */
function adjustFile(src, dest, args) {
  if (!args) {
    args = {}
  }
  if (typeof src === 'string') {
    src = fs.readFileSync(src)
  }
  const strData = src.toString()
  const slotRegex = /(\/\*|##).*\*\//gm
  let resAry = null
  const slots = []
  while ((resAry = slotRegex.exec(strData)) !== null) {
    slots.push([resAry.index, slotRegex.lastIndex])
  }
  let writeData = ''
  if (slots.length) {
    let curIdx = 0
    for (let i = 0; i < slots.length; ++i) {
      const slot = slots[i]
      let begIdx = slot[0]
      if (slot[0] - 3 >= 0 && strData.substring(slot[0] - 3, slot[0]) === '{} ') {
        begIdx -= 3
      } else if (slot[0] - 2 >= 0 && strData.substring(slot[0] - 2, slot[0]) === '{}') {
        begIdx -= 2
      } else if (slot[0] - 3 >= 0 && strData.substring(slot[0] - 3, slot[0]) === '[] ') {
        begIdx -= 3
      } else if (slot[0] - 2 >= 0 && strData.substring(slot[0] - 2, slot[0]) === '[]') {
        begIdx -= 2
      } else if (slot[0] - 3 >= 0 && strData.substring(slot[0] - 3, slot[0]) === "'' ") {
        begIdx -= 3
      } else if (slot[0] - 2 >= 0 && strData.substring(slot[0] - 2, slot[0]) === "''") {
        begIdx -= 2
      } else if (slot[0] - 2 >= 0 && strData.substring(slot[0] - 2, slot[0]) === '0 ') {
        begIdx -= 2
      } else if (slot[0] - 1 >= 0 && strData.substring(slot[0] - 1, slot[0]) === '0') {
        begIdx -= 1
      }
      const adjCode = strData.substring(slot[0] + 2, slot[1] - 2)
      const func = new Function(...Object.keys(args), adjCode)
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

export async function del(pid) {
  const project = await db.select(Project, { _index: pid })
  if (project.thread) {
    await stopSync(project)
  }
  for (const mid of project.models) {
    const model = await db.select(Model, { _index: mid })
    for (const sid of model.svcs) {
      await db.remove(Service, { _index: sid })
    }
    await db.remove(Model, { _index: mid })
  }
  return db.remove(Project, { _index: pid })
}

export async function stop(pid) {
  await db.save(Project, { thread: 0 }, { _index: pid })
  setTimeout(() => stopSync(pid), 1)
  return { message: '停止中……' }
}

/**
 *
 * @param {*} pjt string | { _id: string; thread: number }
 * @returns
 */
export async function stopSync(pjt) {
  const project = typeof pjt === 'string' ? await db.select(Project, { _index: pjt }) : pjt
  spawnSync(
    [`docker container stop ${project.name}`, `docker container rm ${project.name}`].join(' && '),
    {
      stdio: 'inherit',
      shell: true
    }
  )
  return db.save(Project, { thread: 0 }, { _index: project._id })
}

const statsFmt = [
  '"{\\"name\\":\\"{{ .Name }}\\"',
  '\\"pid\\":{{ .PIDs }}',
  '\\"memory\\":{\\"raw\\":\\"{{ .MemUsage }}\\"',
  '\\"percent\\":\\"{{ .MemPerc }}\\"}',
  '\\"cpu\\":\\"{{ .CPUPerc }}\\"',
  '\\"io\\":{\\"net\\":\\"{{ .NetIO }}\\"',
  '\\"block\\":\\"{{ .BlockIO }}\\"}}"'
].join(',')

export async function status(pid) {
  const project = typeof pid === 'string' ? await db.select(Project, { _index: pid }) : pid
  const chkPms = axios.get(
    `http://${
      process.env.BASE_URL || (process.env.NODE_ENV === 'prod' ? project.name : '127.0.0.1')
    }:${project.port}/${project.name}/mdl/v1`
  )
  if (!project.thread) {
    try {
      await chkPms
    } catch (e) {
      return { stat: 'stopped' }
    }
    return { stat: 'loading' }
  } else {
    try {
      await chkPms
    } catch (e) {
      return { stat: 'loading' }
    }
    const res = spawnSync(`docker stats --no-stream --format ${statsFmt} ${project.name}`, {
      shell: true
    })
    return Object.assign({ stat: 'running' }, JSON.parse(res.stdout.toString()))
  }
}

export async function pjtsWithStt(params) {
  const projects = await db.select(Project, params)
  return projects.map(async project => Object.assign({ health: await status(project) }, project))
}

/**
 *
 * @param {*} pid
 * @param {*} cfg {
    gitURL: string
    name: string
    buildCmd: string
    indexPath: string
    assetsPath: string
  }
 */
export async function deploy(pid, cfg) {
  const project = await db.select(Project, { _index: pid })
  const genPath = Path.resolve(svrCfg.apps, project.name, 'temp')
  console.log(`生成页面缓存目录：${genPath}`)
  try {
    fs.accessSync(genPath)
    fs.rmSync(genPath, { recursive: true })
  } catch (e) {
    console.log()
  }
  fs.mkdirSync(genPath, { recursive: true })

  console.log('开始部署……')
  spawnSync(
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

/**
 *
 * @param {*} info {
    pid: string
    name?: string
    files: { src: string; dest: string }[]
  }
 * @returns
 */
export async function transfer(info) {
  if (!info.name) {
    const project = await db.select(Project, { _index: info.pid })
    if (!project.thread) {
      return Promise.resolve('项目未启动')
    }
    info.name = project.name
  }
  const rootPath = `${info.name}:/app`
  console.log('开始传输文件……')
  const cmds = info.files.map(file => {
    console.log(`复制文件：${file.src} -> ${rootPath}${file.dest}`)
    const dir = Path.parse(`/app${file.dest}`).dir
    return [
      `docker exec ${info.name} /bin/mkdir -p ${dir}/`,
      `docker cp ${file.src} ${rootPath}${file.dest}`
    ].join(' && ')
  })
  spawnSync(cmds.join(' && '), {
    stdio: 'inherit',
    shell: true
  })
}

export async function getAllAPIs(pid) {
  const ret = []
  const project = await db.select(Project, { _index: pid })
  for (const mid of project.models) {
    const model = await db.select(Model, { _index: mid }, { ext: true })
    for (const service of model.svcs) {
      switch (service.emit) {
        case 'api':
          ret.push({
            key: service.id,
            name: service.name,
            func: service.interface,
            model: model.name,
            method: service.method,
            path: service.path
          })
          break
        case 'timeout':
        case 'interval':
          ret.push({
            key: `${service.id}_restart`,
            name: service.name,
            func: service.interface,
            model: model.name,
            method: 'POST',
            path: service.path
          })
          ret.push({
            key: `${service.id}_stop`,
            name: service.name,
            interface: service.interface,
            model: model.name,
            method: 'DELETE',
            path: `${service.path}/:tmot`
          })
          break
      }
      if (service.flow) {
        ret[ret.length - 1].flow = service.flow
      }
    }
  }
  return ret
}

export async function buildMid(project) {
  const hasAuth = project.auth.model

  const svrCfg = await readConfig(Path.resolve('configs', 'server'))
  const tmpPath = Path.resolve('resources', 'mid-temp')
  const genPath = Path.resolve(svrCfg.apps, `${project.name}-mid`)
  console.log('初始化中台项目……')
  fs.rmSync(genPath, { recursive: true, force: true })
  fs.mkdirSync(genPath, { recursive: true })

  const pkgTmp = Path.join(tmpPath, 'package.json')
  const pkgGen = Path.join(genPath, 'package.json')
  console.log(`调整package文件：${pkgTmp} -> ${pkgGen}`)
  adjustFile(pkgTmp, pkgGen, { project })
  const vueTmp = Path.join(tmpPath, 'vue.config.js')
  const vueGen = Path.join(genPath, 'vue.config.js')
  console.log(`调整vue配置文件：${vueTmp} -> ${vueGen}`)
  adjustFile(vueTmp, vueGen, { project })
  const tsTmp = Path.join(tmpPath, 'tsconfig.json')
  const tsGen = Path.join(genPath, 'tsconfig.json')
  console.log(`复制ts配置文件：${tsTmp} -> ${tsGen}`)
  fs.copyFileSync(tsTmp, tsGen)
  const bblTmp = Path.join(tmpPath, 'babel.config.js')
  const bblGen = Path.join(genPath, 'babel.config.js')
  console.log(`复制babel配置文件：${bblTmp} -> ${bblGen}`)
  fs.copyFileSync(bblTmp, bblGen)
  fs.mkdirSync(Path.join(genPath, 'public'), { recursive: true })
  const idxTmp = Path.join(tmpPath, 'public', 'index.html')
  const idxGen = Path.join(genPath, 'public', 'index.html')
  console.log(`复制html原始文件：${idxTmp} -> ${idxGen}`)
  fs.copyFileSync(idxTmp, idxGen)
  const icoTmp = Path.join(tmpPath, 'public', 'favicon.ico')
  const icoGen = Path.join(genPath, 'public', 'favicon.ico')
  console.log(`复制html原始文件：${icoTmp} -> ${icoGen}`)
  fs.copyFileSync(icoTmp, icoGen)

  const tmpSrcPath = Path.join(tmpPath, 'src')
  const genSrcPath = Path.join(genPath, 'src')
  fs.mkdirSync(genSrcPath, { recursive: true })
  const mnTmp = Path.join(tmpSrcPath, 'main.ts')
  const mnGen = Path.join(genSrcPath, 'main.ts')
  console.log(`复制src/main文件：${mnTmp} -> ${mnGen}`)
  fs.copyFileSync(mnTmp, mnGen)
  const appTmp = Path.join(tmpSrcPath, 'App.vue')
  const appGen = Path.join(genSrcPath, 'App.vue')
  console.log(`复制src/App.vue文件：${appTmp} -> ${appGen}`)
  fs.copyFileSync(appTmp, appGen)
  const cssTmp = Path.join(tmpSrcPath, 'styles.less')
  const cssGen = Path.join(genSrcPath, 'styles.less')
  console.log(`复制src/styles.less文件：${cssTmp} -> ${cssGen}`)
  fs.copyFileSync(cssTmp, cssGen)
  const utlTmp = Path.join(tmpSrcPath, 'utils.ts')
  const utlGen = Path.join(genSrcPath, 'utils.ts')
  console.log(`调整src/utils.ts文件：${utlTmp} -> ${utlGen}`)
  adjustFile(utlTmp, utlGen, { project })
  const svueTmp = Path.join(tmpSrcPath, 'shims-vue.d.ts')
  const svueGen = Path.join(genSrcPath, 'shims-vue.d.ts')
  console.log(`复制src/shims-vue.d.ts文件：${svueTmp} -> ${svueGen}`)
  fs.copyFileSync(svueTmp, svueGen)
  const typTmp = Path.join(tmpSrcPath, 'types')
  const typGen = Path.join(genSrcPath, 'types')
  console.log(`复制src/types文件夹：${typTmp} -> ${typGen}`)
  copyDir(typTmp, typGen)
  for (const model of project.models) {
    const result = await exportClass(model._id, { name: model.name })
    const flPath = Path.join(typGen, result.fileName)
    fs.writeFileSync(flPath, result.content)
  }
  const cmpTmp = Path.join(tmpSrcPath, 'components')
  const cmpGen = Path.join(genSrcPath, 'components')
  console.log(`复制src/components文件夹：${cmpTmp} -> ${cmpGen}`)
  copyDir(cmpTmp, cmpGen)
  const astTmp = Path.join(tmpSrcPath, 'assets')
  const astGen = Path.join(genSrcPath, 'assets')
  console.log(`复制src/assets文件夹：${astTmp} -> ${astGen}`)
  copyDir(astTmp, astGen)

  console.log('根据权限生成登录页面，并配置路由……')
  fs.mkdirSync(Path.join(genSrcPath, 'router'), { recursive: true })
  const rtTmp = Path.join(tmpSrcPath, 'router', 'index.ts')
  const rtGen = Path.join(genSrcPath, 'router', 'index.ts')
  fs.mkdirSync(Path.join(genSrcPath, 'views'), { recursive: true })
  if (hasAuth) {
    const auth = (await db.select(Model, { _index: project.auth.model })).toObject()
    const apiTmp = Path.join(tmpSrcPath, 'api.ts')
    const apiGen = Path.join(genSrcPath, 'api.ts')
    console.log(`复制src/api.ts文件：${apiTmp} -> ${apiGen}`)
    adjustFile(apiTmp, apiGen, { project, auth })
    console.log(`调整src/router/index.ts文件：${rtTmp} -> ${rtGen}`)
    adjustFile(rtTmp, rtGen, { auth, project })
    const lgnTmp = Path.join(tmpSrcPath, 'views', 'Login.vue')
    const lgnGen = Path.join(genSrcPath, 'views', 'Login.vue')
    console.log(`复制src/views/Login.vue文件：${lgnTmp} -> ${lgnGen}`)
    const fields = project.auth.props
      .map(prop => auth.form.fields.find(field => field.refer === prop.name))
      .filter(field => field)
      .map(field => Object.assign(pickOrIgnore(field, ['_id']), { key: field._id }))
    project.middle.login = pickOrIgnore(project.middle.login, ['_id'])
    adjustFile(lgnTmp, lgnGen, { project, fields })
  } else {
    const apiTmp = Path.join(tmpSrcPath, 'api.ts')
    const apiGen = Path.join(genSrcPath, 'api.ts')
    console.log(`复制src/api.ts文件：${apiTmp} -> ${apiGen}`)
    fs.copyFileSync(apiTmp, apiGen)
    console.log(`调整src/router/index.ts文件：${rtTmp} -> ${rtGen}`)
    adjustFile(rtTmp, rtGen, { auth: null, project })
  }

  console.log('根据导航栏信息，生成布局……')
  fs.mkdirSync(Path.join(genSrcPath, 'layout'), { recursive: true })
  const lytTmp = Path.join(tmpSrcPath, 'layout', 'index.vue')
  const lytGen = Path.join(genSrcPath, 'layout', 'index.vue')
  console.log(`调整src/layout/index.vue文件：${lytTmp} -> ${lytGen}`)
  adjustFile(lytTmp, lytGen, { project })

  console.log('生成中台首页……')
  const hmTmp = Path.join(tmpSrcPath, 'views', 'Home.vue')
  const hmGen = Path.join(genSrcPath, 'views', 'Home.vue')
  console.log(`复制src/views/Home.vue文件：${hmTmp} -> ${hmGen}`)
  adjustFile(hmTmp, hmGen, {
    models: await Promise.all(project.models.map(model => db.select(Model, { _index: model._id })))
  })
  return Promise.resolve(genPath)
}

export async function pubMiddle(pid, pubInfo) {
  const project = (await db.select(Project, { _index: pid }, { ext: true })).toObject()
  const genPath = await buildMid(project)
  console.log(`发布中台到目录：${genPath}`)
  await db.saveOne(Project, pid, { 'middle.lclDep': pubInfo.lclDep })
  spawnSync(
    [
      'export NODE_OPTIONS=--max_old_space_size=2048',
      'npm config set registry http://registry.npm.taobao.org',
      'npm install --unsafe-perm=true --allow-root',
      'npm run build',
      `docker cp ${Path.join(genPath, 'dist') + '/.'} ${project.name}:/app/public`,
      `docker exec ${project.name} mv /app/public/index.html /app/views/index.html`
    ].join(' && '),
    {
      cwd: genPath,
      stdio: 'inherit',
      shell: true
    }
  )
  return {
    midURL: [
      `http://${process.env.NODE_ENV === 'prod' ? project.name : '127.0.0.1'}`,
      `:${project.port}/${project.name}`,
      project.middle.prefix ? `/${project.middle.prefix}` : '',
      '/login'
    ].join('')
  }
}

export async function genMiddle(ctx) {
  const project = (await db.select(Project, { _index: ctx.params.pid }, { ext: true })).toObject()
  await buildMid(project)
  console.log('打包中台……')
  const flName = `${project.name}-mid.tar`
  spawnSync(`tar -cvf ${flName} ${project.name}-mid`, {
    cwd: Path.resolve(svrCfg.apps),
    stdio: 'inherit',
    shell: true
  })
  const phName = Path.join(svrCfg.apps, flName)
  ctx.attachment(phName)
  await sendfile(ctx, phName)
}

export async function depMiddle(pid, depInfo) {
  const idxHtml = depInfo.fileList.find(file => file.name !== 'index.html')
  if (!idxHtml) {
    return { error: '选择正确的dist文件夹：该文件夹无index.html文件' }
  }
  await transfer({
    pid,
    files: depInfo.fileList.map(file =>
      Object.assign(file, { dest: `/public/${rmvStartsOf(file.dest, 'dist/')}` })
    )
  })
  const project = await db.select(Project, { _index: pid })
  spawnSync(`docker exec ${project.name} mv /app/public/index.html /app/views/index.html`, {
    stdio: 'inherit',
    shell: true
  })
  return { message: '部署完毕！' }
}

export async function chkMiddle(pid) {
  const project = await db.select(Project, { _index: pid })
  const midURL = [
    `http://${process.env.NODE_ENV === 'prod' ? project.name : '127.0.0.1'}`,
    `:${project.port}/${project.name}`,
    project.middle.prefix ? `/${project.middle.prefix}` : '',
    '/login'
  ].join('')
  try {
    await axios.get(midURL)
  } catch (e) {
    return { midURL, status: 'loading' }
  }
  return { midURL, status: 'published' }
}
