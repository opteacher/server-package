import axios from 'axios'
import { makeRequest, reqAll, reqDelete, reqPost, reqPut } from './utils'

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
  verify: (token: string) =>
    makeRequest(
      axios.post('' /*return `'/${project.name}/api/v1/${auth.name}/verify'`*/, undefined, {
        headers: { Authorization: 'Bearer ' + token }
      })
    ),
  verifyDeep: (token: string) =>
    makeRequest(
      axios.post('' /*return `'/${project.name}/api/v1/${auth.name}/verify/deep'`*/, undefined, {
        headers: { Authorization: 'Bearer ' + token }
      })
    )
}
