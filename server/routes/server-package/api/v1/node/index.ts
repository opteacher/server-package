import Router from 'koa-router'
import { temps, newTemp, temp } from '../../../../../services/node.js'

const router = new Router()

router.get('/temps', async ctx => {
  ctx.body = {
    result: await temps()
  }
})

router.post('/temp', async ctx => {
  ctx.body = {
    result: await newTemp(ctx.request.body)
  }
})

router.get('/temp/:gid', async ctx => {
  ctx.body = {
    result: await temp(ctx.params.gid)
  }
})

export default router
