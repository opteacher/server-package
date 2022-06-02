import Router from 'koa-router'
import {
  sync,
  del,
  stop,
  status,
  deploy,
  transfer,
  getAllAPIs,
  pubMiddle,
  chkMiddle
} from '../../../../../services/project.js'
import { exportClass, getData } from '../../../../../services/model.js'
import { bind, unbind, genSign } from '../../../../../services/auth.js'

const router = new Router()

router.put('/:pid/sync', async ctx => {
  ctx.body = {
    result: await sync(ctx.params.pid)
  }
})

router.get('/:pid/stat', async ctx => {
  ctx.body = {
    result: await status(ctx.params.pid)
  }
})

router.put('/:pid/stop', async ctx => {
  ctx.body = {
    result: await stop(ctx.params.pid)
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
    result: await getData(ctx.params.pid, ctx.params.mid)
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
  ctx.body = {
    result: await pubMiddle(ctx.params.pid, ctx.request.body)
  }
})

router.get('/:pid/middle/status', async ctx => {
  ctx.body = {
    result: await chkMiddle(ctx.params.pid)
  }
})

export default router
