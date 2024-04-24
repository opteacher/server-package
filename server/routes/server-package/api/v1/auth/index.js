import Router from 'koa-router'
import { verify, verifyDeep } from '../../../../../services/auth2.js'

const router = new Router()

/**
 * @param {object} ctx.request.body
 * @property {authorization} headers - Bearer加密token
 * @property {'GET'|'POST'|'PUT'|'DELETE'} method
 * @property {string} path
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