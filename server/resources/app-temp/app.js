import fs from 'fs'
import path from 'path'
import https from 'https'
import Koa from 'koa'
import koaBody from 'koa-body'
import json from 'koa-json'
import logger from 'koa-logger'
import { default as sslify } from 'koa-sslify'
import statc from 'koa-static'
import views from 'koa-views'
import cors from 'koa2-cors'
import Agendash from 'agendash'
import { agenda } from './utils/index.js'
import { genApiRoutes } from './lib/backend-library/router/index.js'
import { genMdlRoutes } from './lib/backend-library/models/index.js'
/*return project.auth.model ? 'import { auth } from \'./services/auth.js\'' : ''*/
/*return start_svcs.concat(stop_svcs).map(svc => `import { ${svc.interface} } from \'./services/${svc.name}.js\'`).join('\n')*/
const router = await genApiRoutes(path.resolve('routes'))
const models = await genMdlRoutes(path.resolve('models'), path.resolve('configs', 'models'))
const app = new Koa()
app.proxy = true
// 跨域配置
app.use(cors())
// 日志输出
app.use(logger())
// 鉴权
/*return project.auth.model ? 'app.use(auth())' : '// 无权限系统'*/
// 上传配置
app.use(
  koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 200 * 1024 * 1024 // 设置上传文件大小最大限制，默认2M
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
// 路径分配
app.use(router.routes()).use(router.allowedMethods())
// 模型路由
app.use(models.router.routes()).use(models.router.allowedMethods())
// Agendash路由
for (const middleware of Agendash(agenda, { middleware: 'koa' })) {
  app.use(middleware)
}
// Https服务
/*return project.https ? 'app.use(sslify())' : ''*/
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
