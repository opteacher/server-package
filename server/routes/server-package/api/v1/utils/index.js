import Router from 'koa-router'
import Path from 'path'
import fs from 'fs'

const router = new Router()

router.post('/file/upload', async ctx => {
  const file = ctx.request.files?.file
  let dstFile = file.filepath
  const name = ctx.request.body.keepName
    ? file.originalFilename
    : Path.basename(dstFile)
  if (ctx.request.body.absPath) {
    const absPath = ctx.request.body.absPath
    try {
      fs.accessSync(absPath)
    } catch (e) {
      fs.mkdirSync(absPath, { recursive: true })
    }
    dstFile = Path.join(absPath, name)
  } else if (ctx.request.body.relPath) {
    const relPath = Path.join(Path.dirname(dstFile), ctx.request.body.relPath)
    try {
      fs.accessSync(relPath)
    } catch (e) {
      fs.mkdirSync(relPath, { recursive: true })
    }
    dstFile = Path.join(relPath, name)
  }
  if (dstFile !== file.filepath) {
    fs.renameSync(file.filepath, dstFile)
  }
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
