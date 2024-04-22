import Router from 'koa-router'
import { verify, verifyDeep } from '../../../../../services/auth2.js'

const router = new Router()

/**
 * @param ctx.request.body:
 * @member headers: { authorization: string; Bearer加密token }
 * @member method: 'GET' | 'POST' | 'PUT' | 'DELETE'
 * @member path: string
 */
router.post('/verify', ctx => {
  ctx.body = {
    result: verify(ctx.request.body)
  }
})

router.post('/verifyDeep', ctx => {
  ctx.body = {
    result: verifyDeep(ctx.request.body)
  }
})

export default router