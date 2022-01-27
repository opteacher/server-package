import Router from 'koa-router'
/*return `import { ${route.interface} } from '${route.path.substring(0, route.path.indexOf('/:') === -1 ? route.path.length : route.path.indexOf('/:')).split('/').map(() => '..').join('/')}/services/${route.service}.js'`*/

const router = new Router()

/*return `router.${route.method.toLowerCase()}('${(() => { const ret = route.path.substring(route.path.indexOf('/:')); return ret === route.path ? '/' : ret })()}', async ctx => {\n  ctx.body = {\n    result: await ${route.interface}(ctx.params, ctx.request.query, ctx.request.body)\n  }\n})`*/

export default router
