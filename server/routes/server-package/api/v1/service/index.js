import Router from 'koa-router'

import { rmv as rmvNode, save as saveNode } from '../../../../../services/node.js'
import {
  getNodesFmSvc,
  expSvcFlow,
  genSvcCode,
  impSvcFlow,
  readAllNodes,
  restart,
  rmv,
  stop
} from '../../../../../services/service.js'

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
    result: await restart(ctx.request.query.pid, ctx.params.sid, ctx.headers['authorization'])
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
    result: await stop(ctx.request.query.pid, ctx.params.sid, ctx.headers['authorization'])
  }
})

router.post('/:sid/node', async ctx => {
  ctx.body = {
    result: await saveNode(ctx.request.body, ctx.params.sid, ctx.query.flowMod)
  }
})

router.post('/:sid/node/:nid', async ctx => {
  ctx.body = {
    result: await saveNode(
      Object.assign(ctx.request.body, { key: ctx.params.nid }),
      ctx.params.sid,
      ctx.query.flowMod
    )
  }
})

router.delete('/:sid/node/:nid', async ctx => {
  ctx.body = {
    result: await rmvNode(ctx.params.nid, ctx.params.sid, ctx.query.flowMod)
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

router.post('/:sid/node/:nid/build', async ctx => {
  ctx.body = {
    result: await getNodesFmSvc(ctx.params.sid, ctx.params.nid, ctx.request.body)
  }
})

router.get('/:sid/flow/export', expSvcFlow)

router.post('/:sid/flow/import', impSvcFlow)

export default router
