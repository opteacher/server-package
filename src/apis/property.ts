import Model from '@/types/model'
import { reqDelete, reqPost, reqPut } from '@/utils'

export default (model: Model, refresh: () => any) => ({
  all: async () => model.props,
  add: (data: any) => reqPost(`model/${model.key}/property`, data, { type: 'api' }).then(refresh),
  remove: (prop: any) =>
    reqDelete(`model/${model.key}`, `property/${prop.key}`, { type: 'api' }).then(refresh),
  update: (data: any) =>
    reqPut(`model/${model.key}`, `property/${data.key}`, data, { type: 'api' }).then(refresh)
})
