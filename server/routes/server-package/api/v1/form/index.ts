import Router from 'koa-router'
import { insertField } from '../../../../../services/model.js'

const router = new Router()

router.post('/:fmId/field/:id', async ctx => {
  ctx.body = {
    result: await insertField([ctx.params.fmId, ctx.params.id], ctx.request.body)
  }
})

export default router
