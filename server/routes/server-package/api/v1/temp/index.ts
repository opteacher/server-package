import Router from 'koa-router'
import { File } from 'formidable'

const router = new Router()

router.post('/file', async ctx => {
  ctx.body = {
    result: (ctx.request.files?.file as File).path
  }
})

export default router
