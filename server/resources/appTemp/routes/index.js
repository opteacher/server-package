import Router from 'koa-router'
/*return `import { ${api.interface} } from '../${api.path.substring(0, api.path.indexOf('/:') === -1 ? api.path.length : api.path.indexOf('/:')).split('/').map(() => '..').join('/')}/services/${api.name}.js'`*/

const router = new Router()

/*return `router.${api.method.toLowerCase()}('${(() => { const ret = api.path.substring(api.path.indexOf('/:')); return ret === api.path ? '/' : ret })()}', async ctx => {\n  ctx.body = {\n    result: await ${api.interface}(ctx.params, ctx.request.query, ctx.request.body)\n  }\n})`*/

export default router
