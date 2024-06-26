import { reqAll, reqPost, reqPut, reqDelete } from '@/utils'
import Database from '../types/database'

export default {
  add: (data: any) => reqPost('database', data),
  remove: (data: any) => reqDelete('database', data.key),
  update: (data: any) => reqPut('database', data.key, data),
  all: (offset: number, limit: number) =>
    reqAll('database', { axiosConfig: { params: { offset, limit } }, copy: Database.copy }),
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
