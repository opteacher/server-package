import Router from 'koa-router'
import { create, del, genForm, genTable, newRecord } from '../../../../../services/model.js'

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

router.post('/:mid/form', async ctx => {
  ctx.body = {
    result: await genForm(ctx.params.mid)
  }
})

router.post('/:mid/table', async ctx => {
  ctx.body = {
    result: await genTable(ctx.params.mid)
  }
})

router.post('/:mid/record', async ctx => {
  ctx.body = {
    result: await newRecord(ctx.params.mid, ctx.request.body)
  }
})

export default router
