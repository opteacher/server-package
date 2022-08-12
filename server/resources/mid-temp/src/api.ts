import { reqAll, reqDelete, reqPost, reqPut } from './utils'

export default {
  add: (mname: string, data: any) => reqPost(mname, data),
  remove: (mname: string, key: any) => reqDelete(mname, key),
  update: (mname: string, key: any, data: any) => reqPut(mname, key, data),
  all: (mname: string) => reqAll(mname),
  login: (data: any) =>
    reqPost('' /*return `\'${auth.name}/sign\'`*/, data, {
      type: 'api',
      ignores: ['remember'],
      messages: { succeed: '' }
    }),
  verify: () => reqPost('' /*return `${auth.name}/verify`*/, undefined, { type: 'api'}),
  verifyDeep: () => reqPost('' /*return `'${auth.name}/verify/deep'`*/, undefined, { type: 'api'})
}
