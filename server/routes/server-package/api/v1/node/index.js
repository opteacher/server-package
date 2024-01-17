import Router from 'koa-router'

import { readAllSubNds } from '../../../../../services/service.js'

const router = new Router()

router.get('/:nid/sub/nodes', async ctx => {
  ctx.body = {
    result: await readAllSubNds(ctx.params.nid)
  }
})

export default router
