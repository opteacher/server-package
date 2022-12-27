import Compo from '@lib/types/compo'
import { reqAll, reqDelete, reqGet, reqPost, reqPut } from "@/utils"

export default {
  add: (data: any) => reqPost('component', data),
  remove: (key: any) => reqDelete('component', key),
  update: (data: any) => reqPut('component', data.key, data),
  all: (query?: any) =>
    reqAll('component', { axiosConfig: { params: query }, copy: Compo.copy }),
  detail: (_key: any) => reqGet('component', _key)
}
