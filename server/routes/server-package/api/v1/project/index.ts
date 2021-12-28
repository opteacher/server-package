import Router from 'koa-router'
import { syncProject } from '../../../../../services/project.js'

const router = new Router()

router.put('/:pid', async ctx => {
  ctx.body = {
    result: await syncProject(ctx.params.pid)
  }
})

export default router
