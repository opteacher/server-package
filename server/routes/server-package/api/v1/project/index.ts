import Router from 'koa-router'
import {
  create,
  sync,
  del,
  stop,
  status,
  deploy,
  transfer,
  getAllAPIs
} from '../../../../../services/project.js'
import { exportClass, getData } from '../../../../../services/model.js'
import { save as saveAuth, del as delAuth } from '../../../../../services/auth.js'

const router = new Router()

router.post('/', async ctx => {
  ctx.body = {
    result: await create(ctx.request.body)
  }
})

router.put('/:pid/sync', async ctx => {
  ctx.body = {
    result: await sync(ctx.params.pid)
  }
})

router.get('/:pid/stat', async ctx => {
  ctx.body = {
    result: await status(ctx.params.pid)
  }
})

router.put('/:pid/stop', async ctx => {
  ctx.body = {
    result: await stop(ctx.params.pid)
  }
})

router.put('/:pid/deploy', async ctx => {
  ctx.body = {
    result: await deploy(ctx.params.pid, ctx.request.body)
  }
})

router.put('/:pid/transfer', async ctx => {
  ctx.body = {
    result: await transfer(Object.assign({ pid: ctx.params.pid }, ctx.request.body))
  }
})

router.delete('/:pid', async ctx => {
  ctx.body = {
    result: await del(ctx.params.pid)
  }
})

router.get('/:pid/model/:mid/data', async ctx => {
  ctx.body = {
    result: await getData(ctx.params.pid, ctx.params.mid)
  }
})

router.post('/:pid/model/:mid/export', async ctx => {
  ctx.body = {
    result: await exportClass(ctx.params.mid, ctx.request.body)
  }
})

router.get('/:pid/apis', async ctx => {
  ctx.body = {
    result: await getAllAPIs(ctx.params.pid)
  }
})

router.post('/:pid/auth', async ctx => {
  ctx.body = {
    result: await saveAuth(ctx.params.pid, ctx.request.body)
  }
})

router.delete('/:pid/auth', async ctx => {
  ctx.body = {
    resut: await delAuth(ctx.params.pid)
  }
})

export default router
