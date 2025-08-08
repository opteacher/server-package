import { reqAll, reqPost, reqPut, reqDelete } from '@/utils'
import Database, { dbDict } from '../types/database'

export default {
  add: (data: any) => reqPost('database', data),
  addByName: (name: string, type: 'mysql' | 'mongo') =>
    reqPost<Database>(
      'database',
      {
        name,
        dbtype: type,
        db: name,
        host: type,
        port: dbDict[type].port,
        username: 'root',
        password: '12345'
      },
      { copy: Database.copy }
    ),
  remove: (data: any) => reqDelete('database', data.key),
  update: (data: any) => reqPut('database', data.key, data),
  all: (offset: number, limit: number) =>
    reqAll('database', { axiosConfig: { params: { offset, limit } }, copy: Database.copy }),
  detail: (_key: any) => {
    console.log('get project detail')
  }
}
