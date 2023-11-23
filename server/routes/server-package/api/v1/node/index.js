import Router from 'koa-router'

import { readAllSubNds, genSubNdsCode } from '../../../../../services/service.js'

const router = new Router()

router.get('/:nid/sub/nodes', async ctx => {
  ctx.body = {
    result: await readAllSubNds(ctx.params.nid)
  }
})

router.get('/:nid/sub/codes', async ctx => {
  ctx.body = {
    result: await genSubNdsCode(ctx.params.nid)
  }
})

export default router
