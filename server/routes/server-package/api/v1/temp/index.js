import Router from 'koa-router'
import { uploadImage } from '../../../../../services/cdn.js'

const router = new Router()

router.post('/file', async ctx => {
  ctx.body = {
    result: (ctx.request.files?.file).path
  }
})

router.post('/image', async ctx => {
  ctx.body = {
    result: await uploadImage((ctx.request.files?.file).path)
  }
})

export default router
