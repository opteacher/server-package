import Router from 'koa-router'
import Path from 'path'
import { renameSync } from 'fs'
import { uploadImage } from '../../../../../services/cdn.js'
import { logger } from '../../../../../utils/index.js'

const router = new Router()

router.post('/file', async ctx => {
  const file = ctx.request.files?.file
  let tmpPath = file.path
  if (ctx.request.body.keepName) {
    const path = Path.parse(tmpPath).dir
    const name = file.name
    tmpPath = Path.resolve(path, name)
    renameSync(file.path, tmpPath)
  }
  ctx.body = {
    result: tmpPath
  }
})

router.post('/image', async ctx => {
  ctx.body = {
    result: await uploadImage((ctx.request.files?.file).path)
  }
})

router.get('/test', ctx => {
  setInterval(() => {
    logger.log('info', Math.random().toString(16))
  }, 2000)
  ctx.body = {
    result: 'abcd'
  }
})

export default router
