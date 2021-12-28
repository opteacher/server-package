import Router from 'koa-router'
import { sync, del, stop, showStatus } from '../../../../../services/project.js'

const router = new Router()

router.put('/:pid/sync', async ctx => {
  ctx.body = {
    result: await sync(ctx.params.pid)
  }
})

router.get('/:pid/stat', async ctx => {
  ctx.body = {
    result: await showStatus(ctx.params.pid)
  }
})

router.put('/:pid/stop', async ctx => {
  ctx.body = {
    result: await stop(ctx.params.pid)
  }
})

router.delete('/:pid', async ctx => {
  ctx.body = {
    result: await del(ctx.params.pid)
  }
})

export default router
