import Router from 'koa-router'

const router = new Router()

router.post('/file', async ctx => {
  ctx.body = {
    result: (ctx.request.files?.file).path
  }
})

export default router
