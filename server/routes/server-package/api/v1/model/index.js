import Router from 'koa-router'
import {
  create,
  rmv,
  genForm,
  genTable,
  saveProp,
  delProp,
  insertField
} from '../../../../../services/model.js'

const router = new Router()

router.post('/', async ctx => {
  ctx.body = {
    result: await create(ctx.request.body)
  }
})

router.delete('/:mid', async ctx => {
  ctx.body = {
    result: await rmv(ctx.params.mid)
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

router.post('/:mid/property', async ctx => {
  ctx.body = {
    result: await saveProp(ctx.request.body, ctx.params.mid)
  }
})

router.put('/:mid/property/:pid', async ctx => {
  ctx.body = {
    result: await saveProp(ctx.request.body, ctx.params.mid, ctx.params.pid)
  }
})

router.delete('/:mid/property/:pid', async ctx => {
  ctx.body = {
    result: await delProp(ctx.params.mid, ctx.params.pid)
  }
})

router.post('/:mid/field/:fid', async ctx => {
  ctx.body = {
    result: await insertField(
      ctx.params.mid,
      ctx.params.fid,
      ctx.request.body.field ? ctx.request.body : undefined
    )
  }
})

export default router
