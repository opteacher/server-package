import path from 'path'
import Koa from 'koa'
import koaBody from 'koa-body'
import json from 'koa-json'
import logger from 'koa-logger'
import statc from 'koa-static'
import cors from 'koa2-cors'

import { genApiRoutes } from './lib/backend-library/router/index.js'
import { genMdlRoutes } from './lib/backend-library/models/index.js'

const __dirname = path.resolve()
const router = await genApiRoutes(
  path.resolve(__dirname, 'routes')
)
const models = (await genMdlRoutes(
  path.resolve(__dirname, 'models'),
  path.resolve(__dirname, '..', 'configs', 'db'),
  path.resolve(__dirname, '..', 'configs', 'models')
)).router

const app = new Koa()

// 跨域配置
app.use(cors())
// 上传配置
app.use(koaBody({
  multipart: true,
  formidable: {
    maxFileSize: 200*1024*1024    // 设置上传文件大小最大限制，默认2M
  },
  jsonLimit: '100mb',
  onError: function (err, ctx) {
    ctx.throw(`Error happened! ${err}`)
  }
}))
// json解析
app.use(json())
// 日志输出
app.use(logger())
// 指定静态目录
app.use(statc(path.join(__dirname, 'public')))
// 模型路由
app.use(models.routes()).use(models.allowedMethods())
// 路径分配
app.use(router.routes()).use(router.allowedMethods())
// 404接口
app.use(async ctx => {
  ctx.body = {
    error: `未找到路由：${ctx.request.path}`
  }
})

app.listen(process.env.PORT || 4000)
