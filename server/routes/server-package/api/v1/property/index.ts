import Router from 'koa-router'
import { genField } from '../../../../../services/property.js'

const router = new Router()

router.post('/:id/field', async ctx => {
  ctx.body = {
    result: await genField(ctx.params.id, ctx.request.body)
  }
})

export default router
