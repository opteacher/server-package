import { reqAll, reqDelete, reqGet, reqPost, reqPut } from '@/utils'
import Compo from '@lib/types/compo'

export default {
  add: (data: any) => reqPost('component', data),
  remove: (data: any) => reqDelete('component', data.key),
  update: (data: any) => reqPut('component', data.key, data),
  all: (query?: any) => reqAll('component', { axiosConfig: { params: query }, copy: Compo.copy }),
  detail: (key: any) => reqGet('component', key),
  getByName: (name: any) =>
    reqAll('component', { axiosConfig: { params: { name } }, copy: Compo.copy }).then(result =>
      result.length ? result[0] : new Compo()
    )
}
