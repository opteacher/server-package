import Router from 'koa-router'
import dayjs from 'dayjs'
/*return services.some(({ service }) => service.emit === 'timeout' || service.emit === 'interval') ? ('import { agenda } from \'' + `../${services[0].service.path.substring(0, services[0].pamIdx).split('/').map(() => '..').join('/')}/utils/index.js'`) : ''*/
/*return services.map(({ service, pamIdx }) => `import { ${service.interface} } from '../${service.path.substring(0, pamIdx).split('/').map(() => '..').join('/')}/services/${service.name}.js'`).join('\n')*/

const router = new Router()

/*return services.map(({ service, pamIdx }) => { switch(service.emit) { case 'api': return `router.${service.method.toLowerCase()}('${service.path.substring(pamIdx) || '/'}', async ctx => {\n  ${service.needRet ? 'ctx.body = {\n    result: ' : ''}await ${service.interface}(ctx)\n${service.needRet ? '  }\n' : ''}})`; case 'timeout': return [`agenda.define(\'${service.name}_${service.interface}\', ${service.interface})`, `router.post('/', async ctx => {\n  await agenda.start()\n  await agenda.schedule(new Date(${service.condition}), \'${service.name}_${service.interface}\')\n  ctx.body = { result: \'${service.name}_${service.interface}\' }\n})`, `router.delete('/', async ctx => {\n  ctx.body = { result: await agenda.cancel({ name: \'${service.name}_${service.interface}\' }) }\n})`].join('\n\n'); case 'interval': return [`agenda.define(\'${service.name}_${service.interface}\', ${service.interface})`, `router.post('/', async ctx => {\n  await agenda.start()\n  const job = await agenda.every(\'${service.condition}\', \'${service.name}_${service.interface}\', undefined, { timezone: dayjs.tz.guess() })\n  ctx.body = { result: job.toJson() }\n})`, `router.delete('/', async ctx => {\n  ctx.body = { result: await agenda.cancel({ name: \'${service.name}_${service.interface}\' }) }\n})`].join('\n\n'); } }).join('\n\n')*/

export default router
