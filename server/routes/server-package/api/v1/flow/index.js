import Router from 'koa-router'

import { buildNodes, colcNodes } from '../../../../../services/service.js'

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

export default router
