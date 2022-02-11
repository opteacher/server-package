import Router from 'koa-router'
import { login, verify, regup } from '../../../../../services/auth.js'

const router = new Router()

router.post('/in', async ctx => {
  ctx.body = {
    result: await login(ctx.request.body)
  }
})

router.get('/verify', async ctx => {
  ctx.body = {
    result: await verify(ctx.headers['authorization'])
  }
})

router.post('/regup', async ctx => {
  ctx.body = {
    result: await regup(ctx.request.body)
  }
})

export default router
