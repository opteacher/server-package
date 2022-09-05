import Router from 'koa-router'
/*return svcs.map(({ svc, pamIdx }) => `import { ${svc.interface} } from '../${svc.path.substring(0, pamIdx).split('/').map(() => '..').join('/')}/services/${svc.name}.js'`).join('\n')*/

const router = new Router()

/*return svcs.map(({ svc, pamIdx }) => { switch(svc.emit) { case 'api': return `router.${svc.method.toLowerCase()}('${svc.path.substring(pamIdx) || '/'}', async ctx => {\n  ${svc.needRet ? 'ctx.body = {\n    result: ' : ''}await ${svc.interface}(ctx)\n${svc.needRet ? '  }\n' : ''}})`; case 'timeout': return `router.post('/', async ctx => {\n  ctx.body = {\n    result: parseInt(setTimeout(async () => await ${svc.interface}(ctx), parseInt(ctx.request.query.timestamp)))\n  }\n})\n\nrouter.delete('/:tmot', async ctx => {\n  ctx.body = {\n    result: clearTimeout(ctx.params.tmot)\n  }\n})`; case 'interval': return `router.post('/', async ctx => {\n  setTimeout(async () => await ${svc.interface}(ctx), 100)\n  ctx.body = {\n    result: parseInt(setInterval(async () => await ${svc.interface}(ctx), parseInt(ctx.request.query.timestamp)))\n  }\n})\n\nrouter.delete('/:tmot', async ctx => {\n  ctx.body = {\n    result: clearInterval(ctx.params.tmot)\n  }\n})`; } }).join('\n\n')*/

export default router
