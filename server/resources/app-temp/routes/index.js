import Router from 'koa-router'
/*return services.map(({ service, pamIdx }) => `import { ${service.interface} } from '../${service.path.substring(0, pamIdx).split('/').map(() => '..').join('/')}/services/${service.name}.js'`).join('\n')*/

const router = new Router()

/*return services.map(({ service, pamIdx }) => { switch(service.emit) { case 'api': return `router.${service.method.toLowerCase()}('${service.path.substring(pamIdx) || '/'}', async ctx => {\n  ${service.needRet ? 'ctx.body = {\n    result: ' : ''}await ${service.interface}(ctx)\n${service.needRet ? '  }\n' : ''}})`; case 'timeout': return `router.post('/', async ctx => {\n  ctx.body = {\n    result: parseInt(setTimeout(async () => await ${service.interface}(ctx), parseInt(ctx.request.query.timestamp)))\n  }\n})\n\nrouter.delete('/:tmot', async ctx => {\n  ctx.body = {\n    result: clearTimeout(ctx.params.tmot)\n  }\n})`; case 'interval': return `router.post('/', async ctx => {\n  setTimeout(async () => await ${service.interface}(ctx), 100)\n  ctx.body = {\n    result: parseInt(setInterval(async () => await ${service.interface}(ctx), parseInt(ctx.request.query.timestamp)))\n  }\n})\n\nrouter.delete('/:tmot', async ctx => {\n  ctx.body = {\n    result: clearInterval(ctx.params.tmot)\n  }\n})`; } }).join('\n\n')*/

export default router
