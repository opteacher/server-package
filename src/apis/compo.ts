import Compo from "@/types/compo"
import { reqAll, reqDelete, reqPost, reqPut } from "@/utils"

export default {
  add: (data: any) => reqPost('component', data),
  remove: (key: any) => reqDelete('component', key),
  update: (data: any) => reqPut('component', data.key, data),
  all: (offset: number, limit: number) =>
    reqAll('component', { query: { offset, limit }, copy: Compo.copy }),
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
