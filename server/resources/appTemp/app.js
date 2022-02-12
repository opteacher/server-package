import path from 'path'
import Koa from 'koa'
import koaBody from 'koa-body'
import json from 'koa-json'
import logger from 'koa-logger'
import statc from 'koa-static'
import views from 'koa-views'
import cors from 'koa2-cors'
import { genApiRoutes } from './lib/backend-library/router/index.js'
import { genMdlRoutes } from './lib/backend-library/models/index.js'
import { db } from './utils/index.js'
import { auth } from './services/auth.js'
const router = await genApiRoutes(path.resolve('routes'))
const models = (await genMdlRoutes(db, path.resolve('models'), path.resolve('configs', 'models')))
  .router
const app = new Koa()
// 跨域配置
app.use(cors())
// 日志输出
app.use(logger())
// 鉴权
app.use(auth(/\//*return ${project.name}*/\/mdl\/v1/))
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
// 模型路由
app.use(models.routes()).use(models.allowedMethods())
// 路径分配
app.use(router.routes()).use(router.allowedMethods())
// 指定页面目录
app.use(views('./views', { extension: 'html' }))
// 以页面路由结尾（如果没有则index.html默认为404页面）
app.use(ctx => ctx.render('index'))

app.listen(0/*return project.port*/, undefined, () => {
  console.log('服务已部署，占用端口：/*return project.port*/')
})
