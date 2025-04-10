import Path from 'path'
import Koa from 'koa'
import koaBody from 'koa-body'
import json from 'koa-json'
import logger from 'koa-logger'
import statc from 'koa-static'
import views from 'koa-views'
import cors from 'koa2-cors'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'

import { genApiRoutes } from './lib/backend-library/router/index.js'
import { genMdlRoutes } from './lib/backend-library/models/index.js'

import { runAll } from './services/project.js'
import { db } from './utils/index.js'

const router = await genApiRoutes(Path.resolve('routes'))
const models = await genMdlRoutes(Path.resolve('models'), Path.resolve('configs', 'models'), db)

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.tz.setDefault(dayjs.tz.guess())

const app = new Koa()

// 日志输出
app.use(logger())
// 跨域配置
app.use(cors())
// 指定页面目录
app.use(views('./views', { extension: 'html' }))
// 上传配置
app.use(
  koaBody({
    multipart: true,
    formidable: {
      maxFileSize: 200 * 1024 * 1024 * 1024 // 设置上传文件大小最大限制，默认2G
    },
    jsonLimit: '100mb',
    onError: function (err, ctx) {
      ctx.throw(400, `Error happened! ${err}`)
    }
  })
)
// json解析
app.use(json())
// 指定静态目录
app.use(statc(Path.resolve('public')))
// 模型路由
app.use(models.router.routes()).use(models.router.allowedMethods())
// 路径分配
app.use(router.routes()).use(router.allowedMethods())
// 以页面路由结尾
app.use(ctx => ctx.render('index'))

app.listen(process.env.PORT || 4000, undefined, () => {
  console.log(`服务已部署，占用端口：${process.env.PORT || 4000}`)
})

runAll()
