/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from 'axios'
import { readFileSync } from 'fs'
import Path from 'path'

import Node from '../models/node.js'
import Project from '../models/project.js'
import Service from '../models/service.js'
import { db } from '../utils/index.js'
import { genDefault } from '../utils/index.js'
import { del as delNode, scanNextss } from './node.js'
import { adjustFile, recuNode } from './project.js'

const RangeRegexp = /(Y|M|D|h|m|s|ms)$/
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
  let timestamp = 0
  if (RangeRegexp.test(svc.condition)) {
    // 以Y/M/D/h/m/s/ms结尾，则表示时间段
    // 对于time，则在此时间段后激发；对于interval，则每过此时间段就执行一次。
    switch (svc.condition.slice(-1)) {
      case 'Y':
        timestamp = parseInt(svc.condition.slice(0, -1)) * 365 * 24 * 60 * 60 * 1000
        break
      case 'M':
        timestamp = parseInt(svc.condition.slice(0, -1)) * 30 * 24 * 60 * 60 * 1000
        break
      case 'W':
        timestamp = parseInt(svc.condition.slice(0, -1)) * 7 * 24 * 60 * 60 * 1000
        break
      case 'D':
        timestamp = parseInt(svc.condition.slice(0, -1)) * 24 * 60 * 60 * 1000
        break
      case 'h':
        timestamp = parseInt(svc.condition.slice(0, -1)) * 60 * 60 * 1000
        break
      case 'm':
        timestamp = parseInt(svc.condition.slice(0, -1)) * 60 * 1000
        break
      case 's':
        if (svc.condition.endsWith('ms')) {
          timestamp = parseInt(svc.condition.slice(0, -2))
        } else {
          timestamp = parseInt(svc.condition.slice(0, -1)) * 1000
        }
        break
    }
  } else if (TimeRegexp.test(svc.condition)) {
    // 除此以外，如果是--/--/00T00:00:00格式存储，则在该时间点执行，激发方式随意
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
    timestamp = datetime.getTime() - now.getTime()
  }
  if (!timestamp) {
    return { error: '错误的时间条件' }
  }
  const resp = await axios.post(
    `${baseURL}${svc.path}?timestamp=${timestamp}`,
    undefined,
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
    `${baseURL}${svc.path}/${svc.jobId}`,
    authorization ? { headers: { authorization } } : undefined
  )
  return db.save(Service, { jobId: 0 }, { _index: jid })
}

export async function del(sid) {
  const service = await db.select(Service, { _index: sid }, { ext: true })
  if (service.flow && service.flow.id) {
    const { allNodes } = await scanNextss(service.flow, '')
    for (const nid of Object.keys(allNodes)) {
      await delNode(nid)
    }
    await delNode(service.flow.id, service.id)
  }
  return db.remove(Service, { _index: sid })
}

export async function genSvcCode(sid) {
  const service = await db.select(Service, { _index: sid }, { ext: true })
  if (service.model) {
    return { error: '模型服务无法生成代码！' }
  }
  service.deps = []
  service.nodes = service.flow
    ? await recuNode(service.flow.id, 4, node => {
        if (node.deps) {
          for (const dep of node.deps) {
            service.deps.push(dep)
          }
        }
      })
    : []
  const svcTmp = Path.join('resources', 'app-temp', 'services', 'temp.js')
  return adjustFile(readFileSync(svcTmp), undefined, {
    services: [service],
    stcVars: service.stcVars,
    genDefault
  })
}

const CardWidth = 300
const CardHeight = 128
const CardHlfWid = CardWidth >> 1
const ArrowHeight = 80
const ArrowHlfHgt = ArrowHeight >> 1
const AddBtnWH = 32
const AddBtnHlfWH = AddBtnWH >> 1
const CardGutter = 50
const CardHlfGutter = CardGutter >> 1

export async function readAllNodes(svcKey) {
  return colcNodes((await db.select(Service, { _index: svcKey }, { ext: false })).flow)
}

async function colcNodes(ndKey) {
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

export async function buildNodes(svcKey, { width }) {
  const service = await db.select(Service, { _index: svcKey }, { ext: false })
  const flowKey = service.flow
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
      await buildNodes(flowKey, { width })
    }
  }

  await colcNodes(flowKey)
  await calcPos(flowKey, 0)
  await fillPlaceholder(flowKey)
  await fixWidth()
  return Object.values(ndMapper)
}
