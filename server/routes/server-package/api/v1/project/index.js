import Router from 'koa-router'
import {
  sync,
  watchSync,
  del,
  stop,
  status,
  deploy,
  transfer,
  getAllAPIs,
  saveMiddle,
  pubMiddle,
  chkMiddle,
  genMiddle,
  depMiddle,
  getWithStats,
  expDockerImage,
  dockerLogsESS,
  disDockerLogs,
  dockerLogsMQTT,
  genRunCmd,
  genCmpYml,
  getDockerLogs
} from '../../../../../services/project.js'
import { exportClass, getData } from '../../../../../services/model.js'
import { bind, unbind, genSign } from '../../../../../services/auth.js'
import { db2StrPolicy } from '../../../../../services/auth2.js'

const router = new Router()

router.get('/s', async ctx => {
  ctx.body = {
    result: await getWithStats(ctx.request.query)
  }
})

router.put('/:pid/sync', async ctx => {
  ctx.body = {
    result: await sync(ctx.params.pid)
  }
})

router.get('/:pid/sync/watch', watchSync)

router.get('/:pid/stat', async ctx => {
  ctx.body = {
    result: await status(ctx.params.pid)
  }
})

router.put('/:pid/stop', async ctx => {
  ctx.body = {
    result: stop(ctx.params.pid)
  }
})

router.put('/:pid/deploy', async ctx => {
  ctx.body = {
    result: await deploy(ctx.params.pid, ctx.request.body)
  }
})

router.put('/:pid/transfer', async ctx => {
  ctx.body = {
    result: await transfer(Object.assign({ pid: ctx.params.pid }, ctx.request.body))
  }
})

router.delete('/:pid', async ctx => {
  ctx.body = {
    result: await del(ctx.params.pid)
  }
})

router.get('/:pid/model/:mid/data', async ctx => {
  ctx.body = {
    result: await getData(ctx)
  }
})

router.post('/:pid/model/:mid/export', async ctx => {
  ctx.body = {
    result: await exportClass(ctx.params.mid, ctx.request.body)
  }
})

router.get('/:pid/apis', async ctx => {
  ctx.body = {
    result: await getAllAPIs(ctx.params.pid)
  }
})

router.post('/:pid/auth/bind', async ctx => {
  ctx.body = {
    result: await bind(ctx.params.pid, ctx.request.body)
  }
})

router.delete('/:pid/auth/unbind', async ctx => {
  ctx.body = {
    resut: await unbind(ctx.params.pid)
  }
})

router.post('/:pid/auth/sign', async ctx => {
  ctx.body = {
    result: await genSign(ctx.params.pid, ctx.request.body.props)
  }
})

router.post('/:pid/middle/publish', async ctx => {
  await saveMiddle(ctx)
  ctx.body = {
    result: await pubMiddle(ctx.params.pid)
  }
})

router.get('/:pid/middle/generate', async ctx => {
  await saveMiddle(ctx)
  ctx.body = {
    result: await genMiddle(ctx)
  }
})

router.put('/:pid/middle/deploy', async ctx => {
  ctx.body = {
    result: await depMiddle(ctx.params.pid, ctx.request.body)
  }
})

router.get('/:pid/middle/status', async ctx => {
  ctx.body = {
    result: await chkMiddle(ctx.params.pid)
  }
})

router.get('/:pid/docker/image/export', expDockerImage)

router.get('/:pid/docker/logs', getDockerLogs)

router.get('/:pid/docker/logs/access/ess', dockerLogsESS)

router.delete('/:pid/docker/logs/exit', async ctx => {
  ctx.body = {
    result: await disDockerLogs(ctx)
  }
})

router.get('/:pid/docker/logs/access/mqtt', async ctx => {
  ctx.body = {
    result: await dockerLogsMQTT(ctx)
  }
})

router.get('/:pid/docker/runCmd', async ctx => {
  ctx.body = {
    result: ctx.query.compose ? await genCmpYml(ctx.params.pid) : await genRunCmd(ctx.params.pid)
  }
})

router.get('/:pid/auth/policy/s', async ctx => {
  ctx.body = {
    result: await db2StrPolicy(ctx.params.pid)
  }
})

export default router
