import Router from 'koa-router'
import { tempNodes, newTemp, tempByGrpAndTtl } from '../../../../../services/node.js'

const router = new Router()

router.get('/temps', async ctx => {
  ctx.body = {
    result: await tempNodes()
  }
})

router.post('/temp', async ctx => {
  ctx.body = {
    result: await newTemp(ctx.request.body)
  }
})

router.get('/temp/exists', async ctx => {
  const query = ctx.request.query
  if (!query.group || !query.title) {
    ctx.body = {
      error: '需要给出group参数和title参数'
    }
    return
  }
  ctx.body = {
    result: await tempByGrpAndTtl(query.group, query.title)
  }
})

export default router
