import Router from 'koa-router'
import { restart, stop } from '../../../../../services/service.js'
import { save as saveNode, del as delNode } from '../../../../../services/node.js'

const router = new Router()

router.post('/:sid/job/restart', async ctx => {
  if (!ctx.request.query.pid) {
    ctx.body = {
      error: '需要在参数中指定项目id！'
    }
    return
  }
  ctx.body = {
    result: await restart(ctx.request.query.pid as string, ctx.params.sid, {
      authorization: ctx.headers['authorization']
    })
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
    result: await stop(ctx.request.query.pid as string, ctx.params.sid, {
      authorization: ctx.headers['authorization']
    })
  }
})

router.post('/:sid/node', async ctx => {
  ctx.body = {
    result: await saveNode(ctx.request.body, ctx.params.sid)
  }
})

router.post('/:sid/node/:nid', async ctx => {
  ctx.body = {
    result: await saveNode(Object.assign(ctx.request.body, { key: ctx.params.nid }), ctx.params.sid)
  }
})

router.delete('/:sid/node/:nid', async ctx => {
  ctx.body = {
    result: await delNode(ctx.params.nid, ctx.params.sid)
  }
})

export default router
