import Router from 'koa-router'

import { add, remove, update } from '../../../../../services/typo.js'

const router = new Router()

router.post('/', async ctx => {
  ctx.body = {
    result: await add(ctx.request.body, ctx.request.query.pid)
  }
})

router.put('/:tid', async ctx => {
  ctx.body = {
    result: await update(
      Object.assign(ctx.request.body, { key: ctx.request.params.tid }),
      ctx.request.query.pid
    )
  }
})

router.delete('/:tid', async ctx => {
  ctx.body = {
    result: await remove(ctx.params.tid, ctx.request.query.pid)
  }
})

export default router
