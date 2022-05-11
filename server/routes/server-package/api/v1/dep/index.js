import Router from 'koa-router'
import Dep from '../../../../../models/dep.js'
import { db } from '../../../../../utils/index.js'

const router = new Router()

router.get('/name/:name', async ctx => {
  const ress = await db.select(Dep, { name: ctx.params.name })
  ctx.body = {
    result: ress.length ? ress[0] : {}
  }
})

export default router
