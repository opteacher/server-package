import Router from 'koa-router'
import { restart, stop } from '../../../../../services/service.js'

const router = new Router()

router.post('/:sid/job/restart', async ctx => {
  if (!ctx.request.query.pid) {
    ctx.body = {
      error: '需要在参数中指定项目id！'
    }
    return
  }
  ctx.body = {
    result: await restart(ctx.request.query.pid as string, ctx.params.sid)
  }
})

router.delete('/:sid/job/stop', async ctx => {
  if (!ctx.request.query.pid) {
    ctx.body = {
      error: '需要在参数中指定项目id！'
    }
    return
  }
  ctx.body = {
    result: await stop(ctx.request.query.pid as string, ctx.params.sid)
  }
})

export default router
