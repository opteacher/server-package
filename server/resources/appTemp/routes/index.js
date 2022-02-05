import Router from 'koa-router'
/*return `import { ${svc.interface} } from '../${svc.path.substring(0, pamIdx).split('/').map(() => '..').join('/')}/services/${svc.name}.js'`*/

const router = new Router()

/*return svc.emit === 'api' ? `router.${svc.method.toLowerCase()}('${svc.path.substring(pamIdx) || '/'}', async ctx => {\n  ctx.body = {\n    result: await ${svc.interface}(ctx.params, ctx.request.query, ctx.request.body)\n  }\n})` : ''*/

/*return svc.emit === 'timeout' ? `router.post('/', async ctx => {\n  ctx.body = {\n    result: parseInt(setTimeout(async () => await ${svc.interface}(), parseInt(ctx.request.query.timestamp)))\n  }\n})\n\nrouter.delete('/:tmot', async ctx => {\n  ctx.body = {\n    result: clearTimeout(ctx.params.tmot)\n  }\n})` : ''*/

/*return svc.emit === 'interval' ? `router.post('/', async ctx => {\n  ctx.body = {\n    result: parseInt(setInterval(async () => await ${svc.interface}(), parseInt(ctx.request.query.timestamp)))\n  }\n})\n\nrouter.delete('/:tmot', async ctx => {\n  ctx.body = {\n    result: clearInterval(ctx.params.tmot)\n  }\n})` : ''*/

export default router
