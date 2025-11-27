import Router from 'koa-router'
import Path from 'path'
import fs from 'fs'

const router = new Router()

router.post('/file/upload', async ctx => {
  const file = ctx.request.files?.file
  const orgFile = file.path
  const orgPath = Path.dirname(orgFile)
  const name = file.name
  let dstFile = orgFile
  if (ctx.request.body.relPath) {
    const relPath = Path.join(orgPath, Path.dirname(ctx.request.body.relPath))
    try {
      fs.accessSync(relPath)
    } catch (e) {
      fs.mkdirSync(relPath, { recursive: true })
    }
    dstFile = Path.join(relPath, name)
  } else if (ctx.request.body.keepName) {
    dstFile = Path.resolve(orgPath, name)
  }
  fs.renameSync(orgFile, dstFile)
  ctx.body = {
    result: dstFile
  }
})

router.get('/ping', ctx => {
  ctx.body = {
    result: 'ping'
  }
})

export default router
