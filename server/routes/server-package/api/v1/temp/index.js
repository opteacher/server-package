import Router from 'koa-router'
import Path from 'path'
import { renameSync } from 'fs'
import { uploadImage } from '../../../../../services/cdn.js'

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

export default router
