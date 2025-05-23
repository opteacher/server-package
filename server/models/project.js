import { db } from '../utils/index.js'

export default db.defineModel(
  'project',
  {
    name: db.PropTypes.String,
    nickName: db.PropTypes.String,
    desc: db.PropTypes.String,
    port: db.PropTypes.Number,
    volumes: db.PropTypes.Array, // 共享文件|夹，冒号分隔
    thread: db.PropTypes.Number,
    logPid: db.PropTypes.Number,
    database: { type: db.PropTypes.Id, ref: 'database' },
    dropDbs: db.PropTypes.Boolean, // 是否在同步时清空数据库
    bldCmds: db.PropTypes.String, // 构建时命令
    runCmds: db.PropTypes.String, // 运行后命令
    extFiles: db.PropTypes.Array, // 跟随项目的附加文件
    https: db.PropTypes.Boolean,
    independ: db.PropTypes.Boolean, // 为true时项目将不依赖server-package，可以单独部署，但秘钥也将独立保存
    envVars: [{
      name: db.PropTypes.String,
      value: db.PropTypes.String
    }],
    expPorts: db.PropTypes.Array,
    gpus: db.PropTypes.Boolean,
    models: [{ type: db.PropTypes.Id, ref: 'model' }],
    services: [{ type: db.PropTypes.Id, ref: 'service' }],
    typos: [{ type: db.PropTypes.Id, ref: 'typo' }],
    auth: {
      model: { type: db.PropTypes.Id, ref: 'model' },
      skips: db.PropTypes.Array,
      props: db.PropTypes.Array,
      roles: [
        {
          name: db.PropTypes.String,
          extend: db.PropTypes.String,
          rules: [
            {
              method: db.PropTypes.String,
              path: db.PropTypes.String,
              value: db.PropTypes.String, // * | s | key | */* | :i
              idens: db.PropTypes.Array,
              action: db.PropTypes.String,
              remark: db.PropTypes.String
            }
          ]
        }
      ],
      apis: [
        {
          method: db.PropTypes.String,
          path: db.PropTypes.String,
          desc: db.PropTypes.String
        }
      ]
    },
    middle: {
      lclDep: db.PropTypes.Boolean,
      prefix: db.PropTypes.String,
      devMode: db.PropTypes.Boolean,
      login: {
        path: db.PropTypes.String,
        bkgdColor: db.PropTypes.String,
        background: db.PropTypes.String,
        title: db.PropTypes.String,
        lblWidth: db.PropTypes.Number,
        width: db.PropTypes.Number,
        align: db.PropTypes.String,
        padding: db.PropTypes.Number,
        radius: db.PropTypes.Number,
        fmBkgdColor: db.PropTypes.String,
        registerable: db.PropTypes.Boolean,
        logAccount: db.PropTypes.Boolean,
        hasLabel: db.PropTypes.Boolean
      },
      navigate: {
        path: db.PropTypes.String,
        theme: db.PropTypes.String,
        logo: db.PropTypes.String
      },
      dashboard: {
        bkgdColor: db.PropTypes.String,
        padding: db.PropTypes.Array, // [width, height]
        children: [{
          ctype: db.PropTypes.String,
          style: db.PropTypes.Object,
          content: db.PropTypes.String,
          children: db.PropTypes.Array
        }]
      }
    },
    front: {
      dist: db.PropTypes.String
    }
  },
  {
    router: {
      methods: ['POST', 'GET', 'PUT', 'LINK']
    }
  }
)
