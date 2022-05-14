import Dep from "@/types/dep"
import { reqAll, reqDelete, reqPost, reqPut } from "@/utils"

export default {
  add: (data: any) => reqPost('dependency', data),
  remove: (key: any) => reqDelete('dependency', key),
  update: (data: any) => reqPut('dependency', data.key, data),
  all: (offset: number, limit: number) =>
    reqAll('dependency', { query: { offset, limit }, copy: Dep.copy }),
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
