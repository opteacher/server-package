/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'
import { spawn, spawnSync } from 'child_process'
import fs from 'fs'
import sendfile from 'koa-sendfile'
import Path from 'path'
import { PassThrough } from 'stream'

import {
  copyDir,
  fixEndsWith,
  fixStartsWith,
  readConfig,
  rmvStartsOf
} from '../lib/backend-library/utils/index.js'
import Dep from '../models/dep.js'
import Model from '../models/model.js'
import Node from '../models/node.js'
import Project from '../models/project.js'
import Service from '../models/service.js'
import { db, genDefault, pickOrIgnore } from '../utils/index.js'

const svrCfg = readConfig(Path.resolve('configs', 'server'))
const dbCfg = readConfig(Path.resolve('configs', 'db'), true)
const tmpPath = Path.resolve('resources', 'app-temp')

function formatToStr(value, vtype) {
  if (typeof value === 'undefined' || value === null) {
    return
  }
  switch (vtype) {
    case 'String':
    case 'LongStr':
      return `\'${value}\'`
    case 'DateTime':
      return value.toString().toLowerCase() === 'now'
        ? 'Date.now'
        : `new Date(${typeof value === 'string' ? "'" + value + "'" : value})`
    case 'Array':
      return Array.isArray(value)
        ? `[${value.map(val => "'" + val + "'").join(', ')}]`
        : fixStartsWith(fixEndsWith(value, ']'), '[')
    case 'Object':
      return typeof value !== 'string' ? JSON.stringify(value) : value
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
function genAnnotation(node, indents, endl = false) {
  return (
    (node.inputs.length || node.outputs.length
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
      .join('\n') + (endl ? '\n' : '')
  )
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
    case 'LongStr':
      return `'${value}'`
    case 'Array':
      return `[${value}]`
    case 'Object':
      return `${value}${
        variable.index
          ? variable.idxType === 'String' || variable.idxType === 'LongStr'
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

export async function recuNode(key, indent, callback, endKey) {
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
      const ret = []
      const nxtNds = await Promise.all(
        node.nexts.map(nxtNode => db.select(Node, { _index: nxtNode.id }))
      )
      // 把code为空的条件节点移到数组最后
      nxtNds.push(
        ...nxtNds.splice(
          nxtNds.findIndex(nd => !nd.code),
          1
        )
      )
      for (let i = 0; i < nxtNds.length; ++i) {
        const nxtNode = nxtNds[i]
        ret.push(
          (i === 0 ? genAnnotation(node, indents, true) : '') +
            indents +
            `${i !== 0 ? '} else ' : ''}${
              nxtNode.code ? 'if (' + fmtCode(Object.assign(nxtNode, { isFun: false })) + ')' : ''
            } {`
        )
        if (nxtNode.nexts && nxtNode.nexts.length) {
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
          genAnnotation(node, indents, true),
          indents,
          `for ${node.isAwait ? 'await' : ''} (const ${fmtOutput(output)} of ${fmtInput(input)}) {`
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
    case 'subNode': {
      const ret = []
      if (node.isFun) {
        ret.push(
          [
            genAnnotation(node, indents),
            '\n',
            indents,
            node.isAwait ? 'async ' : '',
            `function ${node.subFun}(`,
            node.inputs.map(ipt => ipt.name).join(', '),
            ') {'
          ].join('')
        )
      } else {
        ret.push(genAnnotation(node, indents))
      }
      ret.push(...(await recuNode(node.relative, indent + (node.isFun ? 2 : 0), callback)))
      if (node.isFun) {
        ret.push(indents + '}')
      }
      return ret.concat(
        node.nexts.length ? await recuNode(node.nexts[0].id, indent, callback, endKey) : []
      )
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
  const genPath = Path.resolve(svrCfg.apps, project.name)
  console.log(`生成项目到目录：${genPath}`)
  fs.rmSync(genPath, { recursive: true, force: true })
  fs.mkdirSync(genPath, { recursive: true })
  if (!project.database) {
    console.log('检测为前端项目，进行前端项目的生成逻辑……')
    return genFront(project)
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
  fs.mkdirSync(Path.join(genPath, 'configs'))
  const dbCfgTmp = Path.join(tmpPath, 'configs', 'db.toml')
  const dbCfgGen = Path.join(genPath, 'configs', 'db.toml')
  console.log(`调整数据源配置文件：${dbCfgTmp} -> ${dbCfgGen}`)
  adjustFile(dbCfgTmp, dbCfgGen, { database: project.database })
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
  adjustFile(appTmp, appGen, {
    project,
    start_svcs: project.services.filter(svc => svc.emit === 'app_start').flat(),
    stop_svcs: project.services.filter(svc => svc.emit === 'app_stop').flat()
  })

  const dkrTmp = Path.join(tmpPath, 'Dockerfile')
  const dkrGen = Path.join(genPath, 'Dockerfile')
  console.log(`调整Dockerfile文件：${dkrTmp} -> ${dkrGen}`)
  adjustFile(dkrTmp, dkrGen, { project })

  const libTmp = Path.resolve('lib')
  const libGen = Path.join(genPath, 'lib')
  console.log(`复制库文件夹：${libTmp} -> ${libGen}`)
  copyDir(libTmp, libGen, { ignores: [Path.resolve(libTmp, 'node_modules')] })

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
  const svcRts = {}
  const svcMap = {}
  const varMap = {}
  console.log('收集非模型服务实例……')
  for (const service of project.services.filter(svc => !svc.model)) {
    if (service.path) {
      let pamIdx = service.path.indexOf('/:')
      pamIdx = pamIdx === -1 ? service.path.length : pamIdx
      const pathPfx = service.path.substring(0, pamIdx)
      const rotGen = Path.join(rotPath, pathPfx)
      fs.mkdirSync(rotGen, { recursive: true })
      if (rotGen in svcRts) {
        svcRts[rotGen].push({ service, pamIdx })
      } else {
        svcRts[rotGen] = [{ service, pamIdx }]
      }
    }

    if (service.name === 'auth') {
      console.log('跳过授权服务')
      continue
    }

    console.log('收集项目依赖模块：')
    const svcExt = await db.select(Service, { _index: service.id }, { ext: true })
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
    if (!(service.name in svcMap)) {
      svcMap[service.name] = [svcExt]
    } else {
      svcMap[service.name].push(svcExt)
    }
    if (!(service.name in varMap)) {
      varMap[service.name] = svcExt.stcVars
    } else {
      const vnames = new Set(varMap[service.name].map(v => v.name))
      varMap[service.name].push(...svcExt.stcVars.filter(v => !vnames.has(v.name)))
    }
  }
  console.log('生成非模型服务的路由……')
  for (const [rotGen, services] of Object.entries(svcRts)) {
    console.log(`调整路由文件：${rotTmp} -> ${rotGen}/index.js`)
    adjustFile(rotData, `${rotGen}/index.js`, { services })
  }
  console.log('生成非模型服务实例……')
  for (const [aname, services] of Object.entries(svcMap)) {
    const svcGen = Path.join(svcPath, aname + '.js')
    console.log(`调整服务文件：${svcTmp} -> ${svcGen}`)
    adjustFile(svcData, svcGen, { services, stcVars: varMap[aname], genDefault })
  }
  console.log('生成模型实例……')
  for (const model of project.models) {
    const mid = model.id.toString()
    model.services = project.services.filter(svc => svc.model && svc.model.toString() === mid)

    model.props = model.props.map(prop =>
      Object.assign(prop, { default: formatToStr(prop.default, prop.ptype) })
    )

    const mdlGen = Path.join(mdlPath, model.name + '.js')
    console.log(`调整模型文件：${mdlTmp} -> ${mdlGen}`)
    adjustFile(mdlData, mdlGen, { model })
  }
  const pkgTmp = Path.join(tmpPath, 'package.json')
  const pkgGen = Path.join(genPath, 'package.json')
  console.log(`调整package文件：${pkgTmp} -> ${pkgGen}`)
  adjustFile(pkgTmp, pkgGen, {
    project,
    pkgDeps: Object.values(deps).filter(dep => dep.version)
  })
  const pkgLkTmp = Path.join(tmpPath, 'package-lock.json')
  const pkgLkGen = Path.join(genPath, 'package-lock.json')
  console.log(`调整package-lock文件：${pkgLkTmp} -> ${pkgLkGen}`)
  adjustFile(pkgLkTmp, pkgLkGen, { project })
  const nmodTmp = Path.join(tmpPath, 'npm.tar')
  spawnSync(`tar -zxvf ${nmodTmp} -C ${genPath}`, {
    stdio: 'inherit',
    shell: true
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
  const authSvc = project.services.find(svc => svc.name === 'auth' && svc.interface === 'sign')
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
    [`docker build -t ${project.name}:latest ${appPath}`, await pjtRunCmd(project)].join(' && '),
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
export function adjustFile(src, dest, args) {
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
    await db.remove(Model, { _index: mid })
  }
  for (const sid of project.services) {
    await db.remove(Service, { _index: sid })
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
  const project = await db.select(Project, { _index: pid }, { ext: true })
  for (const service of project.services.map(svc => svc.toJSON())) {
    switch (service.emit) {
      case 'api':
        ret.push(
          pickOrIgnore(service, ['id', 'name', 'interface', 'model', 'method', 'path'], false)
        )
        break
      case 'timeout':
      case 'interval':
        ret.push({
          key: `${service.id}_restart`,
          name: service.name,
          func: service.interface,
          method: 'POST',
          path: service.path
        })
        ret.push({
          key: `${service.id}_stop`,
          name: service.name,
          interface: service.interface,
          method: 'DELETE',
          path: `${service.path}/:tmot`
        })
        break
    }
    if (service.flow) {
      ret[ret.length - 1].flow = service.flow
    }
  }
  return ret
}

export async function buildMid(project) {
  const svrCfg = await readConfig(Path.resolve('configs', 'server'))
  const tmpPath = Path.resolve('resources', 'mid-temp')
  const genPath = Path.resolve(svrCfg.apps, `${project.name}-mid`)
  console.log('初始化中台项目……')
  fs.rmSync(genPath, { recursive: true, force: true })
  fs.mkdirSync(genPath, { recursive: true })
  console.log('复制所有文件到目标目录')
  const tmpSrcPath = Path.join(tmpPath, 'src')
  const genSrcPath = Path.join(genPath, 'src')
  copyDir(tmpPath, genPath, {
    ignores: [
      Path.join(tmpPath, '.git'),
      Path.join(tmpPath, '.env'),
      Path.join(tmpPath, 'package.json'),
      Path.join(tmpPath, 'package-lock.json'),
      Path.join(tmpSrcPath, 'Dockerfile'),
      Path.join(tmpSrcPath, 'apis/login.ts'),
      Path.join(tmpSrcPath, 'router/index.ts'),
      Path.join(tmpSrcPath, 'views/login.vue')
    ]
  })
  const envTmp = Path.join(tmpPath, '.env')
  const envGen = Path.join(genPath, '.env')
  console.log(`复制.env文件：${envTmp} -> ${envGen}`)
  adjustFile(envTmp, envGen, { project })
  const pkgTmp = Path.join(tmpPath, 'package.json')
  const pkgGen = Path.join(genPath, 'package.json')
  console.log(`复制package.json文件：${pkgTmp} -> ${pkgGen}`)
  adjustFile(pkgTmp, pkgGen, { project })
  const dkrTmp = Path.join(tmpPath, 'Dockerfile')
  const dkrGen = Path.join(genPath, 'Dockerfile')
  console.log(`复制Dockerfile文件：${dkrTmp} -> ${dkrGen}`)
  adjustFile(dkrTmp, dkrGen, { project })
  console.log('生成json数据：project.json和models.json')
  fs.mkdirSync(Path.join(genSrcPath, 'json'), { recursive: true })
  fs.writeFileSync(
    Path.join(genSrcPath, 'json/project.json'),
    JSON.stringify(pickOrIgnore(project, ['models']))
  )
  fs.writeFileSync(
    Path.join(genSrcPath, 'json/models.json'),
    JSON.stringify(Object.fromEntries(project.models.map(model => [model.name, model])))
  )
  console.log('根据权限生成登录页面，并配置路由……')
  fs.mkdirSync(Path.join(genSrcPath, 'router'), { recursive: true })
  const rtTmp = Path.join(tmpSrcPath, 'router', 'index.ts')
  const rtGen = Path.join(genSrcPath, 'router', 'index.ts')
  if (project.auth.model) {
    let auth = project.auth.model
    if (typeof auth === 'string') {
      auth = await db.select(Model, { _index: project.auth.model }).then(res => res.toJSON())
    }
    const apiTmp = Path.join(tmpSrcPath, 'apis/login.ts')
    const apiGen = Path.join(genSrcPath, 'apis/login.ts')
    console.log(`复制src/apis/login.ts文件：${apiTmp} -> ${apiGen}`)
    adjustFile(apiTmp, apiGen, { auth })
    console.log(`调整src/router/index.ts文件：${rtTmp} -> ${rtGen}`)
    adjustFile(rtTmp, rtGen, { auth, project })
    const lgnTmp = Path.join(tmpSrcPath, 'views/login.vue')
    const lgnGen = Path.join(genSrcPath, 'views/login.vue')
    console.log(`复制src/views/login.vue文件：${lgnTmp} -> ${lgnGen}`)
    const fields = project.auth.props
      .map(prop => auth.form.fields.find(field => field.refer === prop.name))
      .filter(field => field)
      .map(field => Object.assign(pickOrIgnore(field, ['_id']), { key: field._id }))
    project.middle.login = pickOrIgnore(project.middle.login, ['_id'])
    adjustFile(lgnTmp, lgnGen, { fields })
  } else {
    console.log(`调整src/router/index.ts文件：${rtTmp} -> ${rtGen}`)
    adjustFile(rtTmp, rtGen, { auth: null, project })
  }
  return Promise.resolve(genPath)
}

export async function pubMiddle(pid, pubInfo) {
  const project = (await db.select(Project, { _index: pid }, { ext: true })).toObject()
  const genPath = await buildMid(project)
  console.log(`发布中台到目录：${genPath}`)
  await db.saveOne(Project, pid, { 'middle.lclDep': pubInfo.lclDep })
  spawnSync(
    [
      (process.platform === 'win32' ? 'set' : 'export') + ' NODE_OPTIONS=--max_old_space_size=2048',
      'git clone https://gitee.com/opteacher/frontend-library.git lib/frontend-library',
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
  const project = await db
    .select(Project, { _index: ctx.params.pid }, { ext: true })
    .then(res => res.toJSON())
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

export async function expFrtend(ctx) {
  const project = await db.select(Project, { _index: ctx.params.pid })
}

export async function genFront(project) {
  return project
}

export async function expDkrImg(ctx) {
  const project = await db.select(Project, { _index: ctx.params.pid })
  if (!project.thread) {
    ctx.body = {
      result: { error: '项目未启动！' }
    }
    return
  }
  const genPath = Path.resolve(svrCfg.apps, project.name)
  const genTar = genPath + '.tar'
  spawnSync(`docker save -o ${genTar} ${project.name}`, {
    cwd: Path.resolve(svrCfg.apps),
    stdio: 'inherit',
    shell: true
  })
  ctx.attachment(genTar)
  await sendfile(ctx, genTar)
  setTimeout(() => fs.rmSync(genTar), 5 * 60 * 1000)
}

export async function acsCtnrLogs(ctx) {
  const project = await db.select(Project, { _index: ctx.params.pid })
  if (!project.thread) {
    ctx.body = {
      result: { error: '项目未启动！' }
    }
    return
  }

  const stream = new PassThrough()
  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  })
  ctx.status = 200
  ctx.body = stream

  const pname = project.name
  const logs = spawn(`docker logs -f ${pname}`, { shell: true, detached: true })
  logs.unref()
  logs.stdout.on('data', data => {
    stream.write('event: message\n')
    data
      .toString()
      .split('\n')
      .map(line => {
        stream.write(`data: ${line}\n`)
      })
    stream.write('\n\n')
  })
  logs.stderr.on('data', data => {
    stream.write('event: error\n')
    data
      .toString()
      .split('\n')
      .map(line => {
        stream.write(`data: ${line}\n`)
      })
    stream.write('\n\n')
  })
  logs.on('close', () => {
    stream.destroy()
  })
  await db.saveOne(Project, ctx.params.pid, { logPid: logs.pid })
}

export async function extCtnrLogs(ctx) {
  const project = await db.select(Project, { _index: ctx.params.pid })
  if (!project.logPid) {
    ctx.body = {
      result: { error: '日志监控未启动！' }
    }
    return
  }
  process.kill(-project.logPid, 'SIGINT')
  await db.saveOne(Project, ctx.params.pid, { logPid: 0 })
  ctx.body = {
    result: { message: '监控进程停止' }
  }
}

export async function pjtRunCmd(pjt) {
  let project = pjt
  if (typeof pjt === 'string') {
    project = await db.select(Project, { _index: pjt })
  }
  return (
    'docker run --rm -itd ' +
    [
      '--network server-package_default',
      `-p 127.0.0.1:${project.port}:${project.port}`,
      ...(project.expPorts || []).map(port => `-p 0.0.0.0:${port}:${port}`),
      ...(project.volumes || []).map(
        volume =>
          `-v ${volume instanceof Array ? volume.join(':') : volume.host + ':' + volume.ctnr}`
      ),
      `--name ${project.name} ${project.name}`
    ].join(' ')
  )
}
