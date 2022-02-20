import Router from 'koa-router'
import { create, del, delProp, newProp } from '../../../../../services/model.js'

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

router.post('/:mid/prop', async ctx => {
  ctx.body = {
    result: await newProp(ctx.request.body, ctx.params.mid)
  }
})

router.delete('/:mid/prop/:pid', async ctx => {
  ctx.body = {
    result: await delProp(ctx.params.pid, ctx.params.mid)
  }
})

export default router
