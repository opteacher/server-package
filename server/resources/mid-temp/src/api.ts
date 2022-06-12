import axios from 'axios'
import { makeRequest, reqAll, reqPost } from './utils'

export default {
  all: (mname: string) => reqAll(mname),
  login: (data: any) =>
    reqPost('' /*return `\'${auth.name}/sign\'`*/, data, {
      type: 'api',
      ignores: ['remember'],
      messages: { succeed: '' }
    }),
  verify: (token: string) =>
    makeRequest(
      axios.post('' /*return `\'${auth.name}/verify\'`*/, undefined, {
        headers: { Authorization: 'Bearer ' + token }
      })
    ),
  verifyDeep: (token: string) =>
    makeRequest(
      axios.post('' /*return `\'${auth.name}/verify/deep\'`*/, undefined, {
        headers: { Authorization: 'Bearer ' + token }
      })
    )
}
