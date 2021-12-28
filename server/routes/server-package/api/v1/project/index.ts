import Router from 'koa-router'
import { syncProject, delProject } from '../../../../../services/project.js'

const router = new Router()

router.put('/:pid/sync', async ctx => {
  ctx.body = {
    result: await syncProject(ctx.params.pid)
  }
})

router.delete('/:pid', async ctx => {
  ctx.body = {
    result: await delProject(ctx.params.pid)
  }
})

export default router
