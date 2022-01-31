import Router from 'koa-router'
import Dependency from '../../../../../models/dependency.js'
import { db } from '../../../../../utils/index.js'

const router = new Router()

router.get('/name/:name', async ctx => {
  const ress = await db.select(Dependency, { name: ctx.params.name })
  ctx.body = {
    result: ress.length ? ress[0] : {}
  }
})

export default router
