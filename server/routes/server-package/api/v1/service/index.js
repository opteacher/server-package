import Router from 'koa-router'
import { restart, stop, rmv, genSvcCode, readAllNodes, buildNodes, expSvcFlow, impSvcFlow } from '../../../../../services/service.js'
import { save as saveNode, rmv as rmvNode } from '../../../../../services/node.js'

const router = new Router()

router.delete('/:sid', async ctx => {
  ctx.body = {
    result: await rmv(ctx.params.sid)
  }
})

router.post('/:sid/job/restart', async ctx => {
  if (!ctx.request.query.pid) {
    ctx.body = {
      error: '需要在参数中指定项目id！'
    }
    return
  }
  ctx.body = {
    result: await restart(
      ctx.request.query.pid,
      ctx.params.sid,
      ctx.headers['authorization']
    )
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
    result: await stop(
      ctx.request.query.pid,
      ctx.params.sid,
      ctx.headers['authorization']
    )
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
    result: await rmvNode(ctx.params.nid, ctx.params.sid)
  }
})

router.get('/:sid/flow/codes', async ctx => {
  ctx.body = {
    result: await genSvcCode(ctx.params.sid)
  }
})

router.get('/:sid/flow/nodes', async ctx => {
  ctx.body = {
    result: await readAllNodes(ctx.params.sid)
  }
})

router.post('/:sid/node/s/build', async ctx => {
  ctx.body = {
    result: await buildNodes(ctx.params.sid, ctx.request.body)
  }
})

router.get('/:sid/flow/export', expSvcFlow)

router.post('/:sid/flow/import', impSvcFlow)

export default router
