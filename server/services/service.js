/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from 'axios'
import fs from 'fs'
import sendfile from 'koa-sendfile'
import _ from 'lodash'
import Path from 'path'

import { readConfig, setProp } from '../lib/backend-library/utils/index.js'
import Dep from '../models/dep.js'
import Node from '../models/node.js'
import Project from '../models/project.js'
import Service from '../models/service.js'
import { db } from '../utils/index.js'
import { genDefault, pickOrIgnore } from '../utils/index.js'
import { adjustFile } from './project.js'
import { nodes2Codes } from './project.js'

const TimeRegexp = /^(--|\d\d)\/(--|\d\d)\/(--|\d\d)T(--|\d\d):(--|\d\d):(--|\d\d)$/

export async function restart(pid, jid, authorization) {
  const pjt = await db.select(Project, { _index: pid })
  const host = process.env.NODE_ENV === 'prod' ? pjt.name : '127.0.0.1'
  const baseURL = `http://${host}:${pjt.port}/${pjt.name}`
  const svc = await db.select(Service, { _index: jid })
  if (svc.jobId) {
    await axios.delete(
      `${baseURL}${svc.path}/${svc.jobId}`,
      authorization ? { headers: { authorization } } : undefined
    )
  }
  let timeparams = {}
  switch (svc.emit) {
    case 'interval':
      timeparams = { timecron: svc.condition }
      break
    case 'timeout':
      const now = new Date()
      const result = TimeRegexp.exec(svc.condition)
      if (!result || result.length < 7) {
        return { error: '错误的时间点格式' }
      }
      const datetime = new Date(
        result[1] === '--' ? now.getFullYear() : parseInt(result[1] + 2000),
        result[2] === '--' ? now.getMonth() : parseInt(result[2]),
        result[3] === '--' ? now.getDay() : parseInt(result[3]),
        result[4] === '--' ? now.getHours() : parseInt(result[4]),
        result[5] === '--' ? now.getMinutes() : parseInt(result[5]),
        result[6] === '--' ? now.getSeconds() : parseInt(result[6])
      )
      timeparams = { datetime }
      break
  }
  if (!timeparams) {
    return { error: '错误的时间条件' }
  }
  const resp = await axios.post(
    baseURL + svc.path,
    timeparams,
    authorization ? { headers: { authorization } } : undefined
  )
  if (resp.status !== 200) {
    return { error: `启动任务错误：${resp.statusText}` }
  }
  return db.save(Service, { jobId: resp.data.result }, { _index: jid })
}

export async function stop(pid, jid, authorization) {
  const pjt = await db.select(Project, { _index: pid })
  const host = process.env.NODE_ENV === 'prod' ? pjt.name : '127.0.0.1'
  const baseURL = `http://${host}:${pjt.port}/${pjt.name}`
  const svc = await db.select(Service, { _index: jid })
  if (!svc.jobId) {
    return { error: '指定任务没有在运行' }
  }
  await axios.delete(
    baseURL + svc.path,
    authorization ? { headers: { authorization } } : undefined
  )
  return db.save(Service, { jobId: '' }, { _index: jid })
}

export async function rmv(sid) {
  const service = await db.select(Service, { _index: sid }, { ext: true })
  if (service.flow && service.flow.id) {
    await colcNodes(service.flow.id).then(nodes =>
      Promise.all(nodes.map(node => db.remove(Node, { _index: node.key })))
    )
  }
  return db.remove(Service, { _index: sid })
}

export async function genFlowCodes(nid, funName) {
  const res = await nodes2Codes(nid, 4)
  const svcTmp = Path.join('resources', 'app-temp', 'services', 'temp.js')
  return adjustFile(fs.readFileSync(svcTmp), undefined, {
    services: [{ interface: funName, ...res }],
    stcVars: [],
    genDefault
  })
}

const CardWidth = 300
const CardHeight = 108
const CardHlfWid = CardWidth >> 1
const ArrowHeight = 80
const ArrowHlfHgt = ArrowHeight >> 1
const AddBtnWH = 32
const AddBtnHlfWH = AddBtnWH >> 1
const CardGutter = 50
const CardHlfGutter = CardGutter >> 1

export async function readAllSubNds(sndKey) {
  return db
    .select(Node, { _index: sndKey }, { ext: false })
    .then(node => (node.relative ? colcNodes(node.relative) : []))
}

export async function colcNodes(ndKey) {
  const ret = []
  const node = await db.select(Node, { _index: ndKey }, { ext: false }).then(node => ({
    key: ndKey,
    ...node.toJSON(),
    posLT: [0, 0],
    btmSvgHgt: ArrowHlfHgt
  }))
  ret.push(node)
  for (const sbKey of node.nexts) {
    ret.push(...(await colcNodes(sbKey)))
  }
  return ret
}

export async function buildNodes(flowKey, width) {
  if (!flowKey) {
    return []
  }
  const ndMapper = Object.fromEntries(
    await colcNodes(flowKey).then(nodes => nodes.map(node => [node.key, node]))
  )

  const calcPos = async (ndKey, height) => {
    const node = ndMapper[ndKey]
    if (!node.previous) {
      node.posLT[0] = (width >> 1) - CardHlfWid
      node.posLT[1] = height
    } else if (node.ntype === 'endNode') {
      const relNode = ndMapper[node.relative]
      node.posLT[0] = relNode.posLT[0]
      let maxHeight = 0
      const traverse = node => {
        if (node.key === ndKey) {
          return
        }
        height = node.posLT[1] + CardHeight + ArrowHeight
        maxHeight = height > maxHeight ? height : maxHeight
        for (const nxtKey of node.nexts) {
          traverse(ndMapper[nxtKey])
        }
      }
      traverse(relNode)
      node.posLT[1] = maxHeight
    } else {
      const pvsNode = ndMapper[node.previous]
      const nexts = pvsNode.nexts
      const oddLen = nexts.length % 2
      const pvsLft = ndMapper[pvsNode.key].posLT[0] + (oddLen ? 0 : CardHlfWid + CardHlfGutter)
      const index = nexts.indexOf(node.key)
      const midIdx = (nexts.length - (oddLen ? 1 : 0)) >> 1
      const idxDif = index - midIdx
      node.posLT[0] =
        pvsLft +
        // + (idxDif > 0 ? CardWidth : 0) //初始定位在中间节点的左边
        idxDif * (CardWidth + CardGutter) // 加上当前节点与中间节点的距离
      // - (idxDif > 0 ? CardWidth : 0) // 如果是右边的节点，则此时定位在节点的右边，调整到左边
      node.posLT[1] = height
    }
    for (const nxtKey of node.nexts) {
      await calcPos(nxtKey, node.posLT[1] + CardHeight + ArrowHeight)
    }
  }

  const fillPlaceholder = async key => {
    const node = ndMapper[key]
    for (const nxtKey of node.nexts) {
      const nxtNode = ndMapper[nxtKey]
      const height = nxtNode.posLT[1] - (node.posLT[1] + CardHeight)
      if (height > ArrowHeight) {
        node.btmSvgHgt = height - ArrowHlfHgt
      }
      await fillPlaceholder(nxtKey)
    }
  }

  const fixWidth = async () => {
    let left = 0
    let right = 0
    for (const node of Object.values(ndMapper)) {
      if (node.posLT[0] < left) {
        left = node.posLT[0]
      }
      if (node.posLT[0] + CardWidth > right) {
        right = node.posLT[0] + CardWidth
      }
    }
    if (width < right - left) {
      width = right - left
      await buildNodes(flowKey, width)
    }
  }

  await colcNodes(flowKey)
  await calcPos(flowKey, 0)
  await fillPlaceholder(flowKey)
  await fixWidth()
  return Object.values(ndMapper)
}

const svrCfg = readConfig(Path.resolve('configs', 'server'))

export async function expSvcFlow(ctx) {
  const svc = await db.select(Service, { _index: ctx.params.sid }, { ext: false })
  const expPath = Path.resolve(svrCfg.apps, 'tmp')
  try {
    fs.mkdirSync(expPath, { recursive: true })
  } catch (e) {}
  const expFile = Path.join(expPath, `${svc.name}.json`)
  const nodes = await colcNodes(svc.flow)
  fs.writeFileSync(
    expFile,
    JSON.stringify({
      flow: svc.flow,
      ndMapper: Object.fromEntries(
        await Promise.all(
          nodes.map(async node => {
            const ret = _.cloneDeep(node)
            setProp(ret, 'key', undefined)
            setProp(ret, '_id', undefined)
            setProp(
              ret,
              'deps',
              await Promise.all(
                node.deps.map(did => db.select(Dep, { _index: did }).then(res => res.name))
              )
            )
            return Promise.resolve([node.key, ret])
          })
        )
      )
    })
  )
  ctx.attachment(expFile)
  await sendfile(ctx, expFile)
  setTimeout(() => {
    try {
      fs.rmSync(expFile)
    } catch (e) {}
  }, 5 * 60 * 1000)
}

async function scanAllNxts(key) {
  const ret = [key]
  const node = await db.select(Node, { _index: key }, { ext: false })
  return ret.concat(...(await Promise.all(node.nexts.map(nxtKey => scanAllNxts(nxtKey)))))
}

export async function impSvcFlow(ctx) {
  const svc = await db.select(Service, { _index: ctx.params.sid }, { ext: false })
  if (svc.flow) {
    console.log(`删除原来额flow树：${svc.flow}`)
    const keys = Array.from(new Set(await scanAllNxts(svc.flow)))
    await Promise.all(keys.map(key => db.remove(Node, { _index: key })))
  }
  console.log('读取JSON文件，根据根节点ID找到根节点并插入数据库')
  const params = JSON.parse(fs.readFileSync(ctx.request.body.impFile).toString('utf8'))
  const ndMapper = params['ndMapper']
  console.log('配置一个旧ID映射新ID的空表')
  const o2nMapper = {}
  const saveNode = async okey => {
    const node = ndMapper[okey]
    const newNd = await db.save(
      Node,
      Object.assign(pickOrIgnore(node, ['deps', 'previous', 'nexts', 'relative']), {
        deps: await Promise.all(
          node.deps.map(name => db.select(Dep, { name }).then(deps => deps[0].id))
        )
      })
    )
    const newNid = newNd.id.toString()
    o2nMapper[okey] = newNid
    if (node.relative && node.relative in o2nMapper) {
      const relative = o2nMapper[node.relative]
      await db.saveOne(Node, newNid, { relative })
      await db.saveOne(Node, relative, { relative: newNid })
    }
    for (const nxtKey of node.nexts) {
      const subNid = await saveNode(nxtKey)
      await db.saveOne(Node, newNd.id, { nexts: subNid }, { updMode: 'append' })
      await db.saveOne(Node, subNid, { previous: newNd.id })
    }
    return newNid
  }
  ctx.body = {
    result: await db.saveOne(Service, ctx.params.sid, { flow: await saveNode(params['flow']) })
  }
}
