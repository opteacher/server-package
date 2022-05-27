import { reqGet, reqPut } from '@/utils'
import Project from '../types/project'

export default {
  update: (data: any) => reqPut('project', data.key, data, { ignores: ['models'] }),
  detail: (key: any) => reqGet('project', key).then((pjt: any) => Project.copy(pjt)),
  status: (key: any) =>
    reqGet('project', `${key}/stat`, {
      type: 'api',
      messages: { notShow: false }
    }).then((pjt: any) => pjt.status),
  apis: (key: any) => reqGet('project', `${key}/apis`, { type: 'api' }),
  middle: {
    login: {
      save: (data: any) => reqPut('project', data.pid, { 'middle.login': data }, { ignores: ['pid'] })
    }
  }
}
