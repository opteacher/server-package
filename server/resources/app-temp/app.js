import fs from 'fs'
import path from 'path'
import https from 'https'
import Koa from 'koa'
import { koaBody } from 'koa-body'
import json from 'koa-json'
import logger from 'koa-logger'
import sslify from 'koa-sslify'
import statc from 'koa-static'
import views from 'koa-views'
import cors from 'koa2-cors'
/*return project.auth.model ? 'import { auth } from \'./services/auth.js\'' : ''*/
/*return start_svcs.concat(stop_svcs).map(svc => `import { ${svc.interface} } from \'./services/${svc.name}.js\'`).join('\n')*/
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import isBetween from 'dayjs/plugin/isBetween.js'
dayjs.extend(isBetween)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault(dayjs.tz.guess())
const app = new Koa()
app.proxy = true
// 跨域配置
app.use(cors())
// 日志输出
app.use(logger())
// 鉴权
/*return project.auth.model ? 'app.use(auth)' : '// 无权限系统'*/
// 上传配置
app.use(
  koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 200 * 1024 * 1024 * 1024 // 设置上传文件大小最大限制，默认2G
    },
    jsonLimit: '100mb',
    onError: function (err, ctx) {
      ctx.throw(`Error happened! ${err}`)
    }
  })
)
// json解析
app.use(json())
// 指定静态目录
app.use(statc(path.resolve('public')))
if (/*return typeof project.database !== 'undefined'*/) {
  const { genApiRoutes } = await import('./lib/backend-library/router/index.js')
  const { genMdlRoutes } = await import('./lib/backend-library/models/index.js')
  const { db, agenda } = await import('./utils/index.js')
  const router = await genApiRoutes(path.resolve('routes'))
  const models = await genMdlRoutes(path.resolve('models'), path.resolve('configs', 'models'), db)
  // 路径分配
  app.use(router.routes()).use(router.allowedMethods())
  // 模型路由
  app.use(models.router.routes()).use(models.router.allowedMethods())
}
// Https服务
/*return project.https ? 'app.use(sslify.default())' : ''*/
// 指定页面目录
app.use(views('./views', { extension: 'html' }))
// 以页面路由结尾（如果没有则index.html默认为404页面）
app.use(ctx => ctx.render('index'))

/*return project.https ? 'const options = { key: fs.readFileSync(\'./certs/private.key\'), cert: fs.readFileSync(\'./certs/certificate.crt\') }' : ''*/
/*return project.https ? 'https.createServer(options, app.callback())' : 'app'*/.listen(
  0/*return project.port*/,
  undefined,
  async () => {
    console.log('服务已部署，占用端口：/*return project.port*/')
    /*return start_svcs.map(svc => `await ${svc.interface}()`).join('\n')*/
  }
)

process.on('exit', () => {
  setTimeout(async () => {
    /*return stop_svcs.map(svc => `await ${svc.interface}()`).join('\n')*/
  }, 0)
})

export default app
