import path from 'path';
import Koa from 'koa';
import koaBody from 'koa-body';
import json from 'koa-json';
import logger from 'koa-logger';
import statc from 'koa-static';
import cors from 'koa2-cors';
import { genMdlRoutes } from './lib/backend-library/models/index.js';
import { db } from './utils/index.js';
const models = (await genMdlRoutes(
    db,
    path.resolve('models'),
    path.resolve('configs', 'models')
)).router
const app = new Koa();
// 跨域配置
app.use(cors());
// 上传配置
app.use(koaBody({
    multipart: true,
    formidable: {
        maxFileSize: 200 * 1024 * 1024 // 设置上传文件大小最大限制，默认2M
    },
    jsonLimit: '100mb',
    onError: function (err, ctx) {
        ctx.throw(`Error happened! ${err}`);
    }
}));
// json解析
app.use(json());
// 日志输出
app.use(logger());
// 指定静态目录
app.use(statc(path.resolve('public')));
// 模型路由
app.use(models.routes()).use(models.allowedMethods());
// 404接口
app.use(async (ctx) => {
    ctx.body = {
        error: `未找到路由：${ctx.request.path}`
    };
});
app.listen(0/*return project.port*/, undefined, () => {
    console.log('服务已部署，占用端口：/*return project.port*/');
})
