import Router from 'koa-router'

import { buildNodes, colcNodes, genFlowCodes } from '../../../../../services/service.js'

const router = new Router()

router.get('/:nid/nodes', async ctx => {
  ctx.body = {
    result: await colcNodes(ctx.params.nid)
  }
})

router.post('/:nid/nodes/build', async ctx => {
  ctx.body = {
    result: await buildNodes(ctx.params.nid, ctx.request.body.width)
  }
})

router.get('/:nid/codes', async ctx => {
  ctx.body = {
    result: await genFlowCodes(ctx.params.nid, ctx.request.query.funName)
  }
})

export default router
