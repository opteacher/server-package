import Router from 'koa-router'
import { create, del } from '../../../../../services/model.js'

const router = new Router()

router.post('/', async ctx => {
  ctx.body = {
    result: await create(ctx.request.body)
  }
})

router.delete('/:mid', async ctx => {
  ctx.body = {
    result: await del(ctx.params.mid)
  }
})

export default router
